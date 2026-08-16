import { ConvexError, v } from "convex/values";
import { makeFunctionReference } from "convex/server";

import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";

const MAX_IMPORT_ROWS = 3_000;
const MAX_IMPORT_PHOTOS = 3_000;
const MAX_STAGE_ROWS = 50;
const IMPORT_BATCH_SIZE = 25;
const MAX_CATEGORIES = 200;
const MAX_SUBCATEGORIES = 2_000;
const MAX_CODES_PER_ASSET = 500;
const PRODUCT_KEY_BACKFILL_BATCH_SIZE = 100;
const PHOTO_WIDTHS = [480, 768, 880, 1080] as const;
const processBatchReference = makeFunctionReference<
  "mutation",
  { jobExternalId: string },
  null
>("catalogImport:processBatch");
const backfillProductKeysReference = makeFunctionReference<
  "mutation",
  { jobExternalId: string; cursor: string | null },
  null
>("catalogImport:backfillProductKeys");

const jobStatusValidator = v.union(
  v.literal("staging"),
  v.literal("ready"),
  v.literal("importing"),
  v.literal("completed"),
  v.literal("failed"),
);

const dimensionValidator = v.object({
  parameter: v.string(),
  value: v.string(),
  notes: v.optional(v.string()),
});

const importProductFields = {
  productName: v.string(),
  partCode: v.string(),
  categoryName: v.string(),
  subcategoryName: v.string(),
  size: v.string(),
  material: v.string(),
  type: v.string(),
  finishPlating: v.string(),
  threadStandard: v.string(),
  sealant: v.string(),
  temperature: v.string(),
  pressure: v.string(),
  connections: v.string(),
  assemblies: v.string(),
  grade: v.string(),
  description: v.string(),
  applications: v.array(v.string()),
  certifications: v.array(v.string()),
  additionalNotes: v.array(v.string()),
  dimensions: v.array(dimensionValidator),
  photoCodes: v.array(v.string()),
  isActive: v.boolean(),
};

const stagedRowValidator = v.object({
  rowNumber: v.number(),
  ...importProductFields,
});

const photoVariantValidator = v.object({
  width: v.number(),
  customId: v.string(),
  fileKey: v.string(),
  size: v.number(),
  url: v.string(),
});

type ImportProduct = {
  productName: string;
  partCode: string;
  categoryName: string;
  subcategoryName: string;
  size: string;
  material: string;
  type: string;
  finishPlating: string;
  threadStandard: string;
  sealant: string;
  temperature: string;
  pressure: string;
  connections: string;
  assemblies: string;
  grade: string;
  description: string;
  applications: string[];
  certifications: string[];
  additionalNotes: string[];
  dimensions: Array<{ parameter: string; value: string; notes?: string }>;
  photoCodes: string[];
  isActive: boolean;
};

function normalizeKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function displayText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function requiredText(value: string, label: string, maxLength: number) {
  const normalized = displayText(value);
  if (!normalized) throw new ConvexError(`${label} is required.`);
  if (normalized.length > maxLength) {
    throw new ConvexError(`${label} must be at most ${maxLength} characters.`);
  }
  return normalized;
}

function optionalText(value: string, label: string, maxLength: number) {
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ConvexError(`${label} must be at most ${maxLength} characters.`);
  }
  return normalized;
}

function normalizeList(values: string[], label: string) {
  if (values.length > 50) {
    throw new ConvexError(`${label} can contain at most 50 values.`);
  }
  return [...new Set(values.map((value) => requiredText(value, label, 500)))];
}

function normalizePhotoCode(value: string) {
  const code = value.trim().toLocaleUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{0,63}$/.test(code)) {
    throw new ConvexError(
      `Invalid photo code ${value}. Use letters, numbers, hyphens, or underscores.`,
    );
  }
  return code;
}

function normalizeContentHash(value: string) {
  const hash = value.trim().toLocaleLowerCase();
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    throw new ConvexError("Product photo content hashes must be SHA-256 values.");
  }
  return hash;
}

function normalizeProduct(product: ImportProduct): ImportProduct {
  if (product.photoCodes.length > 12) {
    throw new ConvexError("A product can reference at most 12 photo codes.");
  }
  if (product.dimensions.length > 50) {
    throw new ConvexError("A product can contain at most 50 dimensions.");
  }
  return {
    productName: requiredText(product.productName, "Product name", 200),
    partCode: requiredText(product.partCode, "Part code", 120),
    categoryName: requiredText(product.categoryName, "Category", 120),
    subcategoryName: requiredText(product.subcategoryName, "Subcategory", 120),
    size: optionalText(product.size, "Size", 500),
    material: optionalText(product.material, "Material", 500),
    type: optionalText(product.type, "Type", 500),
    finishPlating: optionalText(product.finishPlating, "Finish/plating", 500),
    threadStandard: optionalText(product.threadStandard, "Thread standard", 500),
    sealant: optionalText(product.sealant, "Sealant", 500),
    temperature: optionalText(product.temperature, "Temperature", 500),
    pressure: optionalText(product.pressure, "Pressure", 500),
    connections: optionalText(product.connections, "Connections", 2_000),
    assemblies: optionalText(product.assemblies, "Assemblies", 2_000),
    grade: optionalText(product.grade, "Grade", 500),
    description: optionalText(product.description, "Description", 10_000),
    applications: normalizeList(product.applications, "Applications"),
    certifications: normalizeList(product.certifications, "Certifications"),
    additionalNotes: normalizeList(product.additionalNotes, "Additional notes"),
    dimensions: product.dimensions.map((dimension) => ({
      parameter: requiredText(dimension.parameter, "Dimension parameter", 200),
      value: requiredText(dimension.value, "Dimension value", 500),
      ...(dimension.notes?.trim()
        ? { notes: optionalText(dimension.notes, "Dimension notes", 500) }
        : {}),
    })),
    photoCodes: [...new Set(product.photoCodes.map(normalizePhotoCode))],
    isActive: product.isActive,
  };
}

async function requireIdentity(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("You must be signed in to manage catalog imports.");
  }
  return identity;
}

async function ownedJob(
  ctx: MutationCtx | QueryCtx,
  externalId: string,
) {
  const identity = await requireIdentity(ctx);
  const job = await ctx.db
    .query("catalogImportJobs")
    .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
    .unique();
  if (!job || job.createdBy !== identity.tokenIdentifier) {
    throw new ConvexError("The catalog import job no longer exists.");
  }
  return job;
}

async function refreshJobPhotoCounts(
  ctx: MutationCtx,
  job: Doc<"catalogImportJobs">,
) {
  const ready = await ctx.db
    .query("catalogImportPhotos")
    .withIndex("by_job_and_status", (q) =>
      q.eq("jobExternalId", job.externalId).eq("status", "ready"),
    )
    .take(MAX_IMPORT_PHOTOS + 1);
  if (ready.length > MAX_IMPORT_PHOTOS) {
    throw new ConvexError("The import contains too many photo codes.");
  }
  const distinctPhotoAssetCount = new Set(
    ready.flatMap((photo) =>
      photo.assetExternalId ? [photo.assetExternalId] : [],
    ),
  ).size;
  const readyPhotoCount = ready.length;
  const status =
    job.stagedRowCount === job.expectedRowCount &&
    readyPhotoCount === job.expectedPhotoCount
      ? "ready"
      : "staging";
  await ctx.db.patch(job._id, {
    distinctPhotoAssetCount,
    readyPhotoCount,
    ...(job.status === "staging" || job.status === "ready" ? { status } : {}),
    updatedAt: Date.now(),
  });
}

function validateUploadUrl(url: string, customId: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ConvexError("Uploaded product photo URLs must be valid HTTPS URLs.");
  }
  if (
    parsed.protocol !== "https:" ||
    (parsed.hostname !== "utfs.io" && !parsed.hostname.endsWith(".ufs.sh")) ||
    parsed.pathname.split("/").at(-1) !== customId
  ) {
    throw new ConvexError("Uploaded product photo URLs must use their UploadThing custom IDs.");
  }
  return parsed.toString();
}

export const createJob = mutation({
  args: {
    workbookName: v.string(),
    expectedRowCount: v.number(),
    expectedPhotoCount: v.number(),
  },
  returns: v.object({ externalId: v.string() }),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    if (
      !Number.isInteger(args.expectedRowCount) ||
      args.expectedRowCount < 1 ||
      args.expectedRowCount > MAX_IMPORT_ROWS
    ) {
      throw new ConvexError(`Import between 1 and ${MAX_IMPORT_ROWS} products.`);
    }
    if (
      !Number.isInteger(args.expectedPhotoCount) ||
      args.expectedPhotoCount < 0 ||
      args.expectedPhotoCount > MAX_IMPORT_PHOTOS
    ) {
      throw new ConvexError(`Import at most ${MAX_IMPORT_PHOTOS} photo codes.`);
    }
    const externalId = crypto.randomUUID();
    const now = Date.now();
    await ctx.db.insert("catalogImportJobs", {
      externalId,
      createdBy: identity.tokenIdentifier,
      workbookName: requiredText(args.workbookName, "Workbook name", 240),
      status: "staging",
      expectedRowCount: args.expectedRowCount,
      stagedRowCount: 0,
      processedRowCount: 0,
      createdProductCount: 0,
      skippedProductCount: 0,
      errorCount: 0,
      expectedPhotoCount: args.expectedPhotoCount,
      readyPhotoCount: 0,
      distinctPhotoAssetCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return { externalId };
  },
});

export const stageRows = mutation({
  args: {
    jobExternalId: v.string(),
    rows: v.array(stagedRowValidator),
  },
  returns: v.object({ stagedRowCount: v.number() }),
  handler: async (ctx, args) => {
    const job = await ownedJob(ctx, args.jobExternalId);
    if (job.status !== "staging" && job.status !== "ready") {
      throw new ConvexError("This import can no longer accept product rows.");
    }
    if (args.rows.length < 1 || args.rows.length > MAX_STAGE_ROWS) {
      throw new ConvexError(`Stage between 1 and ${MAX_STAGE_ROWS} rows at a time.`);
    }

    let inserted = 0;
    const categories = new Map<string, string>();
    const subcategories = new Map<string, { category: string; name: string }>();

    for (const source of args.rows) {
      if (!Number.isInteger(source.rowNumber) || source.rowNumber < 2) {
        throw new ConvexError("Spreadsheet row numbers must start at 2.");
      }
      const { rowNumber, ...input } = source;
      const product = normalizeProduct(input);
      const normalizedCategory = normalizeKey(product.categoryName);
      const normalizedSubcategory = normalizeKey(product.subcategoryName);
      categories.set(normalizedCategory, product.categoryName);
      subcategories.set(`${normalizedCategory}:${normalizedSubcategory}`, {
        category: normalizedCategory,
        name: product.subcategoryName,
      });

      const existing = await ctx.db
        .query("catalogImportRows")
        .withIndex("by_job_and_row", (q) =>
          q.eq("jobExternalId", job.externalId).eq("rowNumber", rowNumber),
        )
        .unique();
      const rowValue = {
        jobExternalId: job.externalId,
        rowNumber,
        normalizedPartCode: normalizeKey(product.partCode),
        product,
        status: "pending" as const,
      };
      if (existing) await ctx.db.patch(existing._id, rowValue);
      else {
        await ctx.db.insert("catalogImportRows", rowValue);
        inserted += 1;
      }
    }

    for (const [normalizedName, name] of categories) {
      const existing = await ctx.db
        .query("catalogImportCategories")
        .withIndex("by_job_and_normalized_name", (q) =>
          q
            .eq("jobExternalId", job.externalId)
            .eq("normalizedName", normalizedName),
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("catalogImportCategories", {
          jobExternalId: job.externalId,
          normalizedName,
          name,
        });
      }
    }

    for (const [key, subcategory] of subcategories) {
      const normalizedName = key.slice(subcategory.category.length + 1);
      const existing = await ctx.db
        .query("catalogImportSubcategories")
        .withIndex("by_job_and_category_and_normalized_name", (q) =>
          q
            .eq("jobExternalId", job.externalId)
            .eq("categoryNormalizedName", subcategory.category)
            .eq("normalizedName", normalizedName),
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("catalogImportSubcategories", {
          jobExternalId: job.externalId,
          categoryNormalizedName: subcategory.category,
          normalizedName,
          name: subcategory.name,
        });
      }
    }

    const stagedRowCount = job.stagedRowCount + inserted;
    if (stagedRowCount > job.expectedRowCount) {
      throw new ConvexError("The staged row count exceeds the workbook row count.");
    }
    await ctx.db.patch(job._id, {
      stagedRowCount,
      status:
        stagedRowCount === job.expectedRowCount &&
        job.readyPhotoCount === job.expectedPhotoCount
          ? "ready"
          : "staging",
      updatedAt: Date.now(),
    });
    return { stagedRowCount };
  },
});

export const resolvePhotos = mutation({
  args: {
    jobExternalId: v.string(),
    photos: v.array(
      v.object({
        code: v.string(),
        contentHash: v.string(),
        sourceName: v.string(),
      }),
    ),
  },
  returns: v.object({
    uploads: v.array(
      v.object({ code: v.string(), contentHash: v.string() }),
    ),
    reusedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const job = await ownedJob(ctx, args.jobExternalId);
    if (job.status !== "staging" && job.status !== "ready") {
      throw new ConvexError("This import can no longer accept photos.");
    }
    if (args.photos.length < 1 || args.photos.length > 100) {
      throw new ConvexError("Resolve between 1 and 100 photo codes at a time.");
    }

    const uploads: Array<{ code: string; contentHash: string }> = [];
    const uploadHashes = new Set<string>();
    let reusedCount = 0;

    for (const source of args.photos) {
      const code = normalizePhotoCode(source.code);
      const contentHash = normalizeContentHash(source.contentHash);
      const sourceName = requiredText(source.sourceName, "Photo filename", 240);
      const existingJobPhoto = await ctx.db
        .query("catalogImportPhotos")
        .withIndex("by_job_and_code", (q) =>
          q.eq("jobExternalId", job.externalId).eq("code", code),
        )
        .unique();
      if (existingJobPhoto) {
        if (existingJobPhoto.contentHash !== contentHash) {
          throw new ConvexError(`Photo code ${code} has conflicting file contents.`);
        }
        if (existingJobPhoto.status === "ready") reusedCount += 1;
        continue;
      }

      const [existingCode, existingAsset, existingPendingHash] = await Promise.all([
        ctx.db
          .query("productPhotoCodes")
          .withIndex("by_code", (q) => q.eq("code", code))
          .unique(),
        ctx.db
          .query("productPhotoAssets")
          .withIndex("by_content_hash", (q) => q.eq("contentHash", contentHash))
          .unique(),
        ctx.db
          .query("catalogImportPhotos")
          .withIndex("by_job_and_hash", (q) =>
            q.eq("jobExternalId", job.externalId).eq("contentHash", contentHash),
          )
          .first(),
      ]);

      if (existingCode && existingCode.contentHash !== contentHash) {
        throw new ConvexError(
          `Photo code ${code} already belongs to a different image.`,
        );
      }
      const asset = existingCode
        ? await ctx.db
            .query("productPhotoAssets")
            .withIndex("by_external_id", (q) =>
              q.eq("externalId", existingCode.assetExternalId),
            )
            .unique()
        : existingAsset;

      if (asset) {
        if (!existingCode) {
          await ctx.db.insert("productPhotoCodes", {
            code,
            contentHash,
            assetExternalId: asset.externalId,
            updatedAt: Date.now(),
          });
        }
        await ctx.db.insert("catalogImportPhotos", {
          jobExternalId: job.externalId,
          code,
          contentHash,
          sourceName,
          status: "ready",
          assetExternalId: asset.externalId,
        });
        reusedCount += 1;
      } else {
        await ctx.db.insert("catalogImportPhotos", {
          jobExternalId: job.externalId,
          code,
          contentHash,
          sourceName,
          status: "pending",
        });
        if (!existingPendingHash && !uploadHashes.has(contentHash)) {
          uploads.push({ code, contentHash });
          uploadHashes.add(contentHash);
        }
      }
    }

    await refreshJobPhotoCounts(ctx, job);
    return { uploads, reusedCount };
  },
});

export const registerUploadedPhotos = mutation({
  args: {
    jobExternalId: v.string(),
    assets: v.array(
      v.object({
        contentHash: v.string(),
        canonicalUrl: v.string(),
        variants: v.array(photoVariantValidator),
      }),
    ),
  },
  returns: v.object({ registeredCodeCount: v.number() }),
  handler: async (ctx, args) => {
    const job = await ownedJob(ctx, args.jobExternalId);
    if (job.status !== "staging" && job.status !== "ready") {
      throw new ConvexError("This import can no longer register photos.");
    }
    if (args.assets.length < 1 || args.assets.length > 10) {
      throw new ConvexError("Register between 1 and 10 uploaded photos at a time.");
    }

    let registeredCodeCount = 0;
    for (const source of args.assets) {
      const contentHash = normalizeContentHash(source.contentHash);
      if (source.variants.length !== PHOTO_WIDTHS.length) {
        throw new ConvexError("Each product photo needs four responsive variants.");
      }
      const widths = new Set<number>();
      const variants = source.variants.map((variant) => {
        if (!PHOTO_WIDTHS.includes(variant.width as (typeof PHOTO_WIDTHS)[number])) {
          throw new ConvexError("Product photo variant widths are invalid.");
        }
        if (widths.has(variant.width)) {
          throw new ConvexError("Product photo variant widths must be unique.");
        }
        widths.add(variant.width);
        const expectedCustomId = `mrmpl-bulk-product-photo-${contentHash}-${variant.width}-webp`;
        if (variant.customId !== expectedCustomId) {
          throw new ConvexError("Product photo custom IDs are invalid.");
        }
        if (!Number.isInteger(variant.size) || variant.size < 1 || variant.size > 50 * 1024) {
          throw new ConvexError("Product photo variants must be 50 KB or smaller.");
        }
        return {
          ...variant,
          fileKey: requiredText(variant.fileKey, "UploadThing file key", 500),
          url: validateUploadUrl(variant.url, expectedCustomId),
        };
      });
      const canonical = variants.find((variant) => variant.width === 1080);
      if (!canonical || canonical.url !== source.canonicalUrl) {
        throw new ConvexError("The canonical photo must be the 1080px variant.");
      }

      let asset = await ctx.db
        .query("productPhotoAssets")
        .withIndex("by_content_hash", (q) => q.eq("contentHash", contentHash))
        .unique();
      if (!asset) {
        const externalId = crypto.randomUUID();
        const id = await ctx.db.insert("productPhotoAssets", {
          externalId,
          contentHash,
          canonicalUrl: canonical.url,
          variants,
          createdAt: Date.now(),
        });
        asset = await ctx.db.get(id);
      }
      if (!asset) throw new ConvexError("The uploaded photo could not be stored.");

      const photos = await ctx.db
        .query("catalogImportPhotos")
        .withIndex("by_job_and_hash", (q) =>
          q.eq("jobExternalId", job.externalId).eq("contentHash", contentHash),
        )
        .take(MAX_CODES_PER_ASSET + 1);
      if (photos.length > MAX_CODES_PER_ASSET) {
        throw new ConvexError(
          `One image can use at most ${MAX_CODES_PER_ASSET} photo codes per import.`,
        );
      }
      for (const photo of photos) {
        const existingCode = await ctx.db
          .query("productPhotoCodes")
          .withIndex("by_code", (q) => q.eq("code", photo.code))
          .unique();
        if (existingCode && existingCode.contentHash !== contentHash) {
          throw new ConvexError(
            `Photo code ${photo.code} already belongs to a different image.`,
          );
        }
        if (!existingCode) {
          await ctx.db.insert("productPhotoCodes", {
            code: photo.code,
            contentHash,
            assetExternalId: asset.externalId,
            updatedAt: Date.now(),
          });
        }
        await ctx.db.patch(photo._id, {
          status: "ready",
          assetExternalId: asset.externalId,
        });
        registeredCodeCount += 1;
      }
    }

    await refreshJobPhotoCounts(ctx, job);
    return { registeredCodeCount };
  },
});

export const startImport = mutation({
  args: { jobExternalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ownedJob(ctx, args.jobExternalId);
    if (job.status === "completed" || job.status === "importing") return null;
    if (
      job.stagedRowCount !== job.expectedRowCount ||
      job.readyPhotoCount !== job.expectedPhotoCount
    ) {
      throw new ConvexError("Finish staging every product row and photo first.");
    }

    const [importCategories, importSubcategories, existingCategories, existingSubcategories] =
      await Promise.all([
        ctx.db
          .query("catalogImportCategories")
          .withIndex("by_job", (q) => q.eq("jobExternalId", job.externalId))
          .take(MAX_CATEGORIES + 1),
        ctx.db
          .query("catalogImportSubcategories")
          .withIndex("by_job", (q) => q.eq("jobExternalId", job.externalId))
          .take(MAX_SUBCATEGORIES + 1),
        ctx.db.query("categories").withIndex("by_name").take(MAX_CATEGORIES + 1),
        ctx.db
          .query("subcategories")
          .withIndex("by_name")
          .take(MAX_SUBCATEGORIES + 1),
      ]);
    if (
      importCategories.length > MAX_CATEGORIES ||
      existingCategories.length > MAX_CATEGORIES ||
      importSubcategories.length > MAX_SUBCATEGORIES ||
      existingSubcategories.length > MAX_SUBCATEGORIES
    ) {
      throw new ConvexError("The catalog taxonomy exceeds bulk import limits.");
    }

    const categories = new Map(
      existingCategories.map((category) => [
        category.normalizedName ?? normalizeKey(category.name),
        category,
      ]),
    );
    for (const item of importCategories) {
      let category = categories.get(item.normalizedName);
      if (!category) {
        const externalId = crypto.randomUUID();
        const id = await ctx.db.insert("categories", {
          externalId,
          name: item.name,
          normalizedName: item.normalizedName,
          description: "",
        });
        const insertedCategory = await ctx.db.get(id);
        if (!insertedCategory) {
          throw new ConvexError("The category could not be created.");
        }
        category = insertedCategory;
        categories.set(item.normalizedName, category);
      } else if (!category.normalizedName) {
        await ctx.db.patch(category._id, { normalizedName: item.normalizedName });
      }
      await ctx.db.patch(item._id, { resolvedExternalId: category.externalId });
    }

    const subcategories = new Map(
      existingSubcategories.map((subcategory) => [
        `${subcategory.categoryExternalId}:${subcategory.normalizedName ?? normalizeKey(subcategory.name)}`,
        subcategory,
      ]),
    );
    for (const item of importSubcategories) {
      const category = categories.get(item.categoryNormalizedName);
      if (!category) throw new ConvexError("The import category could not be resolved.");
      const key = `${category.externalId}:${item.normalizedName}`;
      let subcategory = subcategories.get(key);
      if (!subcategory) {
        const externalId = crypto.randomUUID();
        const id = await ctx.db.insert("subcategories", {
          externalId,
          name: item.name,
          normalizedName: item.normalizedName,
          categoryExternalId: category.externalId,
        });
        const insertedSubcategory = await ctx.db.get(id);
        if (!insertedSubcategory) {
          throw new ConvexError("The subcategory could not be created.");
        }
        subcategory = insertedSubcategory;
        subcategories.set(key, subcategory);
      } else if (!subcategory.normalizedName) {
        await ctx.db.patch(subcategory._id, {
          normalizedName: item.normalizedName,
        });
      }
      await ctx.db.patch(item._id, {
        resolvedExternalId: subcategory.externalId,
      });
    }

    await ctx.db.patch(job._id, { status: "importing", updatedAt: Date.now() });
    await ctx.scheduler.runAfter(0, backfillProductKeysReference, {
      jobExternalId: job.externalId,
      cursor: null,
    });
    return null;
  },
});

export const backfillProductKeys = internalMutation({
  args: {
    jobExternalId: v.string(),
    cursor: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("catalogImportJobs")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.jobExternalId))
      .unique();
    if (!job || job.status !== "importing") return null;

    const page = await ctx.db
      .query("products")
      .withIndex("by_part_code")
      .paginate({ cursor: args.cursor, numItems: PRODUCT_KEY_BACKFILL_BATCH_SIZE });
    for (const product of page.page) {
      if (!product.normalizedPartCode) {
        await ctx.db.patch(product._id, {
          normalizedPartCode: normalizeKey(product.partCode),
        });
      }
    }
    if (page.isDone) {
      await ctx.scheduler.runAfter(0, processBatchReference, {
        jobExternalId: job.externalId,
      });
    } else {
      await ctx.scheduler.runAfter(0, backfillProductKeysReference, {
        jobExternalId: job.externalId,
        cursor: page.continueCursor,
      });
    }
    return null;
  },
});

export const processBatch = internalMutation({
  args: { jobExternalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("catalogImportJobs")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.jobExternalId))
      .unique();
    if (!job || job.status !== "importing") return null;

    const rows = await ctx.db
      .query("catalogImportRows")
      .withIndex("by_job_and_status_and_row", (q) =>
        q
          .eq("jobExternalId", job.externalId)
          .eq("status", "pending"),
      )
      .take(IMPORT_BATCH_SIZE);
    if (rows.length === 0) {
      await ctx.db.patch(job._id, { status: "completed", updatedAt: Date.now() });
      return null;
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;
    for (const row of rows) {
      try {
        const product = row.product;
        const normalizedCategory = normalizeKey(product.categoryName);
        const normalizedSubcategory = normalizeKey(product.subcategoryName);
        const [categoryImport, subcategoryImport, existingNormalized, existingExact] =
          await Promise.all([
            ctx.db
              .query("catalogImportCategories")
              .withIndex("by_job_and_normalized_name", (q) =>
                q
                  .eq("jobExternalId", job.externalId)
                  .eq("normalizedName", normalizedCategory),
              )
              .unique(),
            ctx.db
              .query("catalogImportSubcategories")
              .withIndex("by_job_and_category_and_normalized_name", (q) =>
                q
                  .eq("jobExternalId", job.externalId)
                  .eq("categoryNormalizedName", normalizedCategory)
                  .eq("normalizedName", normalizedSubcategory),
              )
              .unique(),
            ctx.db
              .query("products")
              .withIndex("by_normalized_part_code", (q) =>
                q.eq("normalizedPartCode", row.normalizedPartCode),
              )
              .first(),
            ctx.db
              .query("products")
              .withIndex("by_part_code", (q) => q.eq("partCode", product.partCode))
              .first(),
          ]);
        if (existingNormalized || existingExact) {
          await ctx.db.patch(row._id, {
            status: "skipped",
            message: "A product with this part code already exists.",
          });
          skipped += 1;
          continue;
        }
        if (!categoryImport?.resolvedExternalId || !subcategoryImport?.resolvedExternalId) {
          throw new Error("The product taxonomy was not resolved.");
        }
        const categoryExternalId = categoryImport.resolvedExternalId;
        const subcategoryExternalId = subcategoryImport.resolvedExternalId;

        const [category, subcategory] = await Promise.all([
          ctx.db
            .query("categories")
            .withIndex("by_external_id", (q) =>
              q.eq("externalId", categoryExternalId),
            )
            .unique(),
          ctx.db
            .query("subcategories")
            .withIndex("by_external_id", (q) =>
              q.eq("externalId", subcategoryExternalId),
            )
            .unique(),
        ]);
        if (!category || !subcategory) {
          throw new Error("The product taxonomy no longer exists.");
        }

        const photoAssets: Array<{
          assetExternalId: string;
          code: string;
          url: string;
        }> = [];
        const linkedAssetIds = new Set<string>();
        for (const rawCode of product.photoCodes) {
          const code = normalizePhotoCode(rawCode);
          const codeRecord = await ctx.db
            .query("productPhotoCodes")
            .withIndex("by_code", (q) => q.eq("code", code))
            .unique();
          if (!codeRecord) throw new Error(`Photo code ${code} is not available.`);
          const asset = await ctx.db
            .query("productPhotoAssets")
            .withIndex("by_external_id", (q) =>
              q.eq("externalId", codeRecord.assetExternalId),
            )
            .unique();
          if (!asset) throw new Error(`Photo code ${code} has no stored asset.`);
          if (linkedAssetIds.has(asset.externalId)) continue;
          linkedAssetIds.add(asset.externalId);
          photoAssets.push({
            assetExternalId: asset.externalId,
            code,
            url: asset.canonicalUrl,
          });
        }

        const externalId = crypto.randomUUID();
        await ctx.db.insert("products", {
          externalId,
          productName: product.productName,
          partCode: product.partCode,
          normalizedPartCode: row.normalizedPartCode,
          category: { _id: category.externalId, name: category.name },
          subCategory: { _id: subcategory.externalId, name: subcategory.name },
          categoryExternalId: category.externalId,
          subcategoryExternalId: subcategory.externalId,
          size: product.size,
          material: product.material,
          type: product.type,
          finishPlating: product.finishPlating,
          threadStandard: product.threadStandard,
          sealant: product.sealant,
          temperature: product.temperature,
          pressure: product.pressure,
          connections: product.connections,
          assemblies: product.assemblies,
          grade: product.grade,
          description: product.description,
          applications: product.applications,
          certifications: product.certifications,
          additionalNotes: product.additionalNotes,
          dimensions: product.dimensions,
          images: photoAssets.map((photo) => photo.url),
          photoCodes: photoAssets.map((photo) => photo.code),
          isActive: product.isActive,
          createdAt: new Date().toISOString(),
        });
        for (const [position, photo] of photoAssets.entries()) {
          await ctx.db.insert("productPhotoLinks", {
            productExternalId: externalId,
            assetExternalId: photo.assetExternalId,
            code: photo.code,
            position,
          });
        }
        await ctx.db.patch(row._id, { status: "completed" });
        created += 1;
      } catch (error) {
        await ctx.db.patch(row._id, {
          status: "error",
          message: error instanceof Error ? error.message : "The product could not be imported.",
        });
        errors += 1;
      }
    }

    await ctx.db.patch(job._id, {
      processedRowCount: job.processedRowCount + rows.length,
      createdProductCount: job.createdProductCount + created,
      skippedProductCount: job.skippedProductCount + skipped,
      errorCount: job.errorCount + errors,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, processBatchReference, {
      jobExternalId: job.externalId,
    });
    return null;
  },
});

export const getJob = query({
  args: { jobExternalId: v.string() },
  returns: v.object({
    externalId: v.string(),
    workbookName: v.string(),
    status: jobStatusValidator,
    expectedRowCount: v.number(),
    stagedRowCount: v.number(),
    processedRowCount: v.number(),
    createdProductCount: v.number(),
    skippedProductCount: v.number(),
    errorCount: v.number(),
    expectedPhotoCount: v.number(),
    readyPhotoCount: v.number(),
    distinctPhotoAssetCount: v.number(),
    failureMessage: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const job = await ownedJob(ctx, args.jobExternalId);
    return {
      externalId: job.externalId,
      workbookName: job.workbookName,
      status: job.status,
      expectedRowCount: job.expectedRowCount,
      stagedRowCount: job.stagedRowCount,
      processedRowCount: job.processedRowCount,
      createdProductCount: job.createdProductCount,
      skippedProductCount: job.skippedProductCount,
      errorCount: job.errorCount,
      expectedPhotoCount: job.expectedPhotoCount,
      readyPhotoCount: job.readyPhotoCount,
      distinctPhotoAssetCount: job.distinctPhotoAssetCount,
      failureMessage: job.failureMessage ?? null,
    };
  },
});
