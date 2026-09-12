import { makeFunctionReference, paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getBulkProductPhotoCustomId } from "../src/lib/bulk-product-photo-contract";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { assertCatalogCapacity, reserveCatalogCapacity } from "./catalogLimits";

const MAX_IMPORT_ROWS = 3_000;
const MAX_IMPORT_PHOTOS = 3_000;
const MAX_STAGE_ROWS = 50;
const IMPORT_BATCH_SIZE = 25;
const PAGE_SIZE = 50;
const ROW_PREFLIGHT_PAGE_SIZE = 20;
const BACKFILL_PAGE_SIZE = 100;
const PHOTO_WIDTHS = [480, 768, 880, 1080] as const;
const IMPORT_RETENTION_MS = 7 * 24 * 60 * 60 * 1_000;
const PROCESSING_WATCHDOG_MS = 11 * 60 * 1_000;
const PHOTO_DELETE_RETRY_BASE_MS = 15 * 60 * 1_000;
const PHOTO_DELETE_RETRY_MAX_MS = 24 * 60 * 60 * 1_000;
const PROVIDER_FINAL_SWEEP_DELAY_MS = 60 * 60 * 1_000;

const processBatchReference = makeFunctionReference<
  "action",
  { jobExternalId: string },
  null
>("catalogImport:processBatch");
const pendingBatchReference = makeFunctionReference<
  "query",
  { jobExternalId: string },
  { rowNumbers: number[] } | null
>("catalogImport:pendingBatch");
const processImportRowReference = makeFunctionReference<
  "mutation",
  { jobExternalId: string; rowNumber: number },
  null
>("catalogImport:processImportRow");
const recordRowErrorReference = makeFunctionReference<
  "mutation",
  { jobExternalId: string; message: string; rowNumber: number },
  null
>("catalogImport:recordRowError");
const finishImportBatchReference = makeFunctionReference<
  "mutation",
  { jobExternalId: string },
  null
>("catalogImport:finishImportBatch");
const backfillCatalogKeysReference = makeFunctionReference<
  "mutation",
  {
    cursor: string | null;
    jobExternalId: string;
    table: "products" | "categories" | "subcategories";
  },
  null
>("catalogImport:backfillCatalogKeys");
const preflightImportReference = makeFunctionReference<
  "mutation",
  {
    conflictCount: number;
    cursor: string | null;
    jobExternalId: string;
    missingCategoryCount: number;
    missingSubcategoryCount: number;
    phase: "rows" | "categories" | "subcategories";
  },
  null
>("catalogImport:preflightImport");
const resetErrorRowsReference = makeFunctionReference<
  "mutation",
  { jobExternalId: string },
  null
>("catalogImport:resetErrorRows");
const releaseJobPhotoHoldsReference = makeFunctionReference<
  "mutation",
  { jobExternalId: string },
  null
>("catalogImport:releaseJobPhotoHolds");
const cleanupExpiredJobsReference = makeFunctionReference<
  "mutation",
  { staleBefore: number },
  null
>("catalogImport:cleanupExpiredJobs");
const markUnlinkedPhotoAssetsReference = makeFunctionReference<
  "mutation",
  { cursor: string | null; staleBefore: number },
  null
>("catalogImport:markUnlinkedPhotoAssets");
const deletePhotoAssetReference = makeFunctionReference<
  "action",
  { assetExternalId: string },
  null
>("catalogImportCleanup:deletePhotoAsset");
const reconcilePhotoAssetDeletionReference = makeFunctionReference<
  "mutation",
  { assetExternalId: string; deleteAttemptedAt: number },
  null
>("catalogImport:reconcilePhotoAssetDeletion");
const sweepJobUploadsReference = makeFunctionReference<
  "action",
  {
    cleanupLockedAt: number;
    jobExternalId: string;
    offset: number;
    phase: "initial" | "final";
  },
  null
>("catalogImportCleanup:sweepJobUploads");
const resumeJobPhotoSweepsReference = makeFunctionReference<
  "mutation",
  Record<string, never>,
  null
>("catalogImport:resumeJobPhotoSweeps");
const clearDeletedAssetBindingsReference = makeFunctionReference<
  "mutation",
  { assetExternalId: string },
  null
>("catalogImport:clearDeletedAssetBindings");
const reconcileImportProgressReference = makeFunctionReference<
  "mutation",
  { jobExternalId: string; processingLeaseAt: number },
  null
>("catalogImport:reconcileImportProgress");

const jobStatusValidator = v.union(
  v.literal("staging"),
  v.literal("ready"),
  v.literal("validating"),
  v.literal("importing"),
  v.literal("retrying"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("canceled"),
);

const rowStatusValidator = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("skipped"),
  v.literal("error"),
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
    throw new ConvexError(
      "Product photo content hashes must be SHA-256 values.",
    );
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
  const partCode = requiredText(product.partCode, "Part code", 120);
  if (!/^\d{2}-\d{3}-\d{3}$/.test(partCode)) {
    throw new ConvexError("Part code must use the NN-NNN-NNN format.");
  }
  return {
    productName: requiredText(product.productName, "Product name", 200),
    partCode,
    categoryName: requiredText(product.categoryName, "Category", 120),
    subcategoryName: requiredText(product.subcategoryName, "Subcategory", 120),
    size: optionalText(product.size, "Size", 500),
    material: optionalText(product.material, "Material", 500),
    type: optionalText(product.type, "Type", 500),
    finishPlating: optionalText(product.finishPlating, "Finish/plating", 500),
    threadStandard: optionalText(
      product.threadStandard,
      "Thread standard",
      500,
    ),
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

async function ownedJob(ctx: MutationCtx | QueryCtx, externalId: string) {
  const identity = await requireIdentity(ctx);
  const job = await ctx.db
    .query("catalogImportJobs")
    .withIndex("by_external_id", (query) => query.eq("externalId", externalId))
    .unique();
  if (!job || job.createdBy !== identity.tokenIdentifier) {
    throw new ConvexError("The catalog import job no longer exists.");
  }
  return job;
}

function isActiveJobStatus(status: Doc<"catalogImportJobs">["status"]) {
  return (
    status === "staging" ||
    status === "ready" ||
    status === "validating" ||
    status === "importing" ||
    status === "retrying"
  );
}

function isActiveAsset(asset: Doc<"productPhotoAssets">) {
  return !asset.lifecycle || asset.lifecycle === "active";
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 1_000) || "The product could not be imported.";
}

function photoDeleteRetryDelay(retryCount: number) {
  return Math.min(
    PHOTO_DELETE_RETRY_MAX_MS,
    PHOTO_DELETE_RETRY_BASE_MS * 2 ** Math.min(retryCount, 7),
  );
}

async function schedulePhotoAssetDeletionAttempt(
  ctx: MutationCtx,
  assetExternalId: string,
  deleteAttemptedAt: number,
  retryCount: number,
) {
  await ctx.scheduler.runAfter(
    photoDeleteRetryDelay(retryCount),
    reconcilePhotoAssetDeletionReference,
    { assetExternalId, deleteAttemptedAt },
  );
  await ctx.scheduler.runAfter(0, deletePhotoAssetReference, {
    assetExternalId,
  });
}

async function scheduleCatalogCleanup(ctx: MutationCtx) {
  const staleBefore = Date.now() - IMPORT_RETENTION_MS;
  await ctx.scheduler.runAfter(0, cleanupExpiredJobsReference, {
    staleBefore,
  });
  await ctx.scheduler.runAfter(0, resumeJobPhotoSweepsReference, {});
  return staleBefore;
}

async function refreshJobPhotoCounts(
  ctx: MutationCtx,
  job: Doc<"catalogImportJobs">,
) {
  const ready = await ctx.db
    .query("catalogImportPhotos")
    .withIndex("by_job_and_status", (query) =>
      query.eq("jobExternalId", job.externalId).eq("status", "ready"),
    )
    .take(MAX_IMPORT_PHOTOS + 1);
  if (ready.length > MAX_IMPORT_PHOTOS) {
    throw new ConvexError("The import contains too many photo codes.");
  }
  const readyPhotoCount = ready.length;
  const status =
    job.stagedRowCount === job.expectedRowCount &&
    readyPhotoCount === job.expectedPhotoCount
      ? "ready"
      : "staging";
  await ctx.db.patch(job._id, {
    readyPhotoCount,
    distinctPhotoAssetCount: new Set(
      ready.flatMap((photo) =>
        photo.assetExternalId ? [photo.assetExternalId] : [],
      ),
    ).size,
    ...(job.status === "staging" || job.status === "ready" ? { status } : {}),
    updatedAt: Date.now(),
  });
}

function validateUploadUrl(url: string, customId: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ConvexError(
      "Uploaded product photo URLs must be valid HTTPS URLs.",
    );
  }
  if (
    parsed.protocol !== "https:" ||
    (parsed.hostname !== "utfs.io" && !parsed.hostname.endsWith(".ufs.sh")) ||
    parsed.pathname.split("/").at(-1) !== customId
  ) {
    throw new ConvexError(
      "Uploaded product photo URLs must use their UploadThing custom IDs.",
    );
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
      throw new ConvexError(
        `Import between 1 and ${MAX_IMPORT_ROWS} products.`,
      );
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
      stagingRetained: true,
      createdAt: now,
      updatedAt: now,
    });
    return { externalId };
  },
});

export const stageRows = mutation({
  args: { jobExternalId: v.string(), rows: v.array(stagedRowValidator) },
  returns: v.object({ stagedRowCount: v.number() }),
  handler: async (ctx, args) => {
    const job = await ownedJob(ctx, args.jobExternalId);
    if (job.status !== "staging" && job.status !== "ready") {
      throw new ConvexError("This import can no longer accept product rows.");
    }
    if (args.rows.length < 1 || args.rows.length > MAX_STAGE_ROWS) {
      throw new ConvexError(
        `Stage between 1 and ${MAX_STAGE_ROWS} rows at a time.`,
      );
    }
    const normalizedRows = args.rows.map((source) => {
      if (!Number.isInteger(source.rowNumber) || source.rowNumber < 2) {
        throw new ConvexError("Spreadsheet row numbers must start at 2.");
      }
      const { rowNumber, ...input } = source;
      const product = normalizeProduct(input);
      return {
        normalizedPartCode: normalizeKey(product.partCode),
        product,
        rowNumber,
      };
    });
    if (
      new Set(normalizedRows.map((row) => row.rowNumber)).size !==
      args.rows.length
    ) {
      throw new ConvexError("Spreadsheet row numbers must be unique.");
    }
    if (
      new Set(normalizedRows.map((row) => row.normalizedPartCode)).size !==
      args.rows.length
    ) {
      throw new ConvexError("Part codes must be unique within the import.");
    }

    const existingRows = await Promise.all(
      normalizedRows.map((row) =>
        ctx.db
          .query("catalogImportRows")
          .withIndex("by_job_and_row", (query) =>
            query
              .eq("jobExternalId", job.externalId)
              .eq("rowNumber", row.rowNumber),
          )
          .unique(),
      ),
    );
    const stagedRowCount =
      job.stagedRowCount + existingRows.filter((row) => !row).length;
    if (stagedRowCount > job.expectedRowCount) {
      throw new ConvexError(
        "The staged row count exceeds the workbook row count.",
      );
    }

    for (const [index, row] of normalizedRows.entries()) {
      const duplicate = await ctx.db
        .query("catalogImportRows")
        .withIndex("by_job_and_normalized_part_code", (query) =>
          query
            .eq("jobExternalId", job.externalId)
            .eq("normalizedPartCode", row.normalizedPartCode),
        )
        .first();
      if (duplicate && duplicate.rowNumber !== row.rowNumber) {
        throw new ConvexError(
          `Rows ${duplicate.rowNumber} and ${row.rowNumber} use the same part code.`,
        );
      }
      const value = {
        jobExternalId: job.externalId,
        rowNumber: row.rowNumber,
        normalizedPartCode: row.normalizedPartCode,
        product: row.product,
        status: "pending" as const,
      };
      const existing = existingRows[index];
      if (existing) await ctx.db.patch(existing._id, value);
      else await ctx.db.insert("catalogImportRows", value);

      const categoryKey = normalizeKey(row.product.categoryName);
      const category = await ctx.db
        .query("catalogImportCategories")
        .withIndex("by_job_and_normalized_name", (query) =>
          query
            .eq("jobExternalId", job.externalId)
            .eq("normalizedName", categoryKey),
        )
        .unique();
      if (!category) {
        await ctx.db.insert("catalogImportCategories", {
          jobExternalId: job.externalId,
          normalizedName: categoryKey,
          name: row.product.categoryName,
        });
      }
      const subcategoryKey = normalizeKey(row.product.subcategoryName);
      const subcategory = await ctx.db
        .query("catalogImportSubcategories")
        .withIndex("by_job_and_category_and_normalized_name", (query) =>
          query
            .eq("jobExternalId", job.externalId)
            .eq("categoryNormalizedName", categoryKey)
            .eq("normalizedName", subcategoryKey),
        )
        .unique();
      if (!subcategory) {
        await ctx.db.insert("catalogImportSubcategories", {
          jobExternalId: job.externalId,
          categoryNormalizedName: categoryKey,
          normalizedName: subcategoryKey,
          name: row.product.subcategoryName,
        });
      }
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
    uploads: v.array(v.object({ code: v.string(), contentHash: v.string() })),
    reusedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const job = await ownedJob(ctx, args.jobExternalId);
    if (
      job.cleanupLockedAt ||
      (job.status !== "staging" && job.status !== "ready")
    ) {
      throw new ConvexError("This import can no longer accept photos.");
    }
    if (args.photos.length < 1 || args.photos.length > 100) {
      throw new ConvexError("Resolve between 1 and 100 photo codes at a time.");
    }
    const photos = args.photos.map((source) => ({
      code: normalizePhotoCode(source.code),
      contentHash: normalizeContentHash(source.contentHash),
      sourceName: requiredText(source.sourceName, "Photo filename", 240),
    }));
    if (new Set(photos.map((photo) => photo.code)).size !== photos.length) {
      throw new ConvexError("Photo codes must be unique within each batch.");
    }

    const uploads: Array<{ code: string; contentHash: string }> = [];
    const uploadHashes = new Set<string>();
    let reusedCount = 0;
    for (const source of photos) {
      const jobPhoto = await ctx.db
        .query("catalogImportPhotos")
        .withIndex("by_job_and_code", (query) =>
          query.eq("jobExternalId", job.externalId).eq("code", source.code),
        )
        .unique();
      if (jobPhoto && jobPhoto.contentHash !== source.contentHash) {
        throw new ConvexError(
          `Photo code ${source.code} has conflicting file contents.`,
        );
      }
      const binding = await ctx.db
        .query("productPhotoCodes")
        .withIndex("by_code", (query) => query.eq("code", source.code))
        .unique();
      if (binding && binding.contentHash !== source.contentHash) {
        throw new ConvexError(
          `Photo code ${source.code} already belongs to a different image.`,
        );
      }
      const boundAssetExternalId = binding?.assetExternalId;
      const boundAsset = boundAssetExternalId
        ? await ctx.db
            .query("productPhotoAssets")
            .withIndex("by_external_id", (query) =>
              query.eq("externalId", boundAssetExternalId),
            )
            .unique()
        : null;
      const hashedAsset = await ctx.db
        .query("productPhotoAssets")
        .withIndex("by_content_hash", (query) =>
          query.eq("contentHash", source.contentHash),
        )
        .first();
      if (
        [boundAsset, hashedAsset].some(
          (asset) => asset?.lifecycle === "deleting",
        )
      ) {
        throw new ConvexError(
          `Photo ${source.code} is being cleaned up. Retry after cleanup finishes.`,
        );
      }
      const asset = [boundAsset, hashedAsset].find(
        (candidate): candidate is Doc<"productPhotoAssets"> =>
          Boolean(candidate && isActiveAsset(candidate)),
      );
      if (asset) {
        if (binding) {
          if (binding.assetExternalId !== asset.externalId) {
            await ctx.db.patch(binding._id, {
              assetExternalId: asset.externalId,
            });
          }
        } else {
          await ctx.db.insert("productPhotoCodes", {
            code: source.code,
            contentHash: source.contentHash,
            assetExternalId: asset.externalId,
            updatedAt: Date.now(),
          });
        }
        const value = {
          jobExternalId: job.externalId,
          code: source.code,
          contentHash: source.contentHash,
          sourceName: source.sourceName,
          status: "ready" as const,
          assetExternalId: asset.externalId,
          holdActive: true,
        };
        if (jobPhoto) await ctx.db.patch(jobPhoto._id, value);
        else await ctx.db.insert("catalogImportPhotos", value);
        reusedCount += 1;
      } else {
        const value = {
          jobExternalId: job.externalId,
          code: source.code,
          contentHash: source.contentHash,
          sourceName: source.sourceName,
          status: "pending" as const,
          holdActive: false,
        };
        if (jobPhoto) await ctx.db.patch(jobPhoto._id, value);
        else await ctx.db.insert("catalogImportPhotos", value);
        if (!uploadHashes.has(source.contentHash)) {
          uploads.push({ code: source.code, contentHash: source.contentHash });
          uploadHashes.add(source.contentHash);
        }
      }
    }
    await refreshJobPhotoCounts(ctx, job);
    return { uploads, reusedCount };
  },
});

export const authorizePhotoUpload = query({
  args: {
    contentHashes: v.array(v.string()),
    jobExternalId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ownedJob(ctx, args.jobExternalId);
    if (
      job.cleanupLockedAt ||
      (job.status !== "staging" && job.status !== "ready")
    ) {
      throw new ConvexError("This import can no longer upload photos.");
    }
    if (args.contentHashes.length < 1 || args.contentHashes.length > 10) {
      throw new ConvexError("Authorize between 1 and 10 product photos.");
    }
    const contentHashes = args.contentHashes.map(normalizeContentHash);
    if (new Set(contentHashes).size !== contentHashes.length) {
      throw new ConvexError("Product photo hashes must be unique.");
    }
    for (const contentHash of contentHashes) {
      const pending = await ctx.db
        .query("catalogImportPhotos")
        .withIndex("by_job_and_hash_and_status", (query) =>
          query
            .eq("jobExternalId", job.externalId)
            .eq("contentHash", contentHash)
            .eq("status", "pending"),
        )
        .first();
      if (!pending) {
        throw new ConvexError(
          "A product photo is not pending in this import manifest.",
        );
      }
    }
    return null;
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
  returns: v.object({
    registeredCodeCount: v.number(),
    discardedFileKeys: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const job = await ownedJob(ctx, args.jobExternalId);
    if (
      job.cleanupLockedAt ||
      (job.status !== "staging" && job.status !== "ready")
    ) {
      throw new ConvexError("This import can no longer register photos.");
    }
    if (args.assets.length < 1 || args.assets.length > 10) {
      throw new ConvexError(
        "Register between 1 and 10 uploaded photos at a time.",
      );
    }
    const uploads = args.assets.map((source) => {
      const contentHash = normalizeContentHash(source.contentHash);
      if (source.variants.length !== PHOTO_WIDTHS.length) {
        throw new ConvexError(
          "Each product photo needs four responsive variants.",
        );
      }
      const widths = new Set<number>();
      const variants = source.variants.map((variant) => {
        if (
          !PHOTO_WIDTHS.includes(variant.width as (typeof PHOTO_WIDTHS)[number])
        ) {
          throw new ConvexError("Product photo variant widths are invalid.");
        }
        if (widths.has(variant.width)) {
          throw new ConvexError("Product photo variant widths must be unique.");
        }
        widths.add(variant.width);
        const customId = getBulkProductPhotoCustomId(
          job.externalId,
          contentHash,
          variant.width,
        );
        if (!customId) {
          throw new ConvexError("Product photo upload identity is invalid.");
        }
        if (variant.customId !== customId) {
          throw new ConvexError("Product photo custom IDs are invalid.");
        }
        if (
          !Number.isInteger(variant.size) ||
          variant.size < 1 ||
          variant.size > 50 * 1_024
        ) {
          throw new ConvexError(
            "Product photo variants must be 50 KB or smaller.",
          );
        }
        return {
          ...variant,
          fileKey: requiredText(variant.fileKey, "UploadThing file key", 500),
          url: validateUploadUrl(variant.url, customId),
        };
      });
      const canonical = variants.find((variant) => variant.width === 1080);
      if (!canonical || canonical.url !== source.canonicalUrl) {
        throw new ConvexError(
          "The canonical photo must be the 1080px variant.",
        );
      }
      return { canonical, contentHash, variants };
    });

    let registeredCodeCount = 0;
    const discardedFileKeys: string[] = [];
    for (const upload of uploads) {
      let asset = await ctx.db
        .query("productPhotoAssets")
        .withIndex("by_content_hash", (query) =>
          query.eq("contentHash", upload.contentHash),
        )
        .first();
      if (asset?.lifecycle === "deleting") {
        throw new ConvexError(
          "This product photo is being cleaned up. Retry after cleanup finishes.",
        );
      }
      if (asset && isActiveAsset(asset)) {
        const retained = new Set(
          asset.variants.map((variant) => variant.fileKey),
        );
        discardedFileKeys.push(
          ...upload.variants.flatMap((variant) =>
            retained.has(variant.fileKey) ? [] : [variant.fileKey],
          ),
        );
      } else if (asset) {
        await ctx.db.patch(asset._id, {
          canonicalUrl: upload.canonical.url,
          variants: upload.variants,
          lifecycle: "active",
          deleteAttemptedAt: undefined,
          deletionError: undefined,
          deletedAt: undefined,
        });
        asset = await ctx.db.get(asset._id);
      } else {
        const id = await ctx.db.insert("productPhotoAssets", {
          externalId: crypto.randomUUID(),
          contentHash: upload.contentHash,
          canonicalUrl: upload.canonical.url,
          variants: upload.variants,
          lifecycle: "active",
          createdAt: Date.now(),
        });
        asset = await ctx.db.get(id);
      }
      if (!asset)
        throw new ConvexError("The uploaded photo could not be stored.");

      const photos = await ctx.db
        .query("catalogImportPhotos")
        .withIndex("by_job_and_hash", (query) =>
          query
            .eq("jobExternalId", job.externalId)
            .eq("contentHash", upload.contentHash),
        )
        .take(MAX_IMPORT_PHOTOS + 1);
      if (photos.length === 0) {
        throw new ConvexError(
          "No pending photo manifest matches this uploaded image.",
        );
      }
      if (photos.length > MAX_IMPORT_PHOTOS) {
        throw new ConvexError(
          `An import can contain at most ${MAX_IMPORT_PHOTOS} photo codes.`,
        );
      }
      for (const photo of photos) {
        const binding = await ctx.db
          .query("productPhotoCodes")
          .withIndex("by_code", (query) => query.eq("code", photo.code))
          .unique();
        if (binding && binding.contentHash !== upload.contentHash) {
          throw new ConvexError(
            `Photo code ${photo.code} already belongs to a different image.`,
          );
        }
        if (binding) {
          await ctx.db.patch(binding._id, {
            assetExternalId: asset.externalId,
            updatedAt: Date.now(),
          });
        } else {
          await ctx.db.insert("productPhotoCodes", {
            code: photo.code,
            contentHash: upload.contentHash,
            assetExternalId: asset.externalId,
            updatedAt: Date.now(),
          });
        }
        await ctx.db.patch(photo._id, {
          status: "ready",
          assetExternalId: asset.externalId,
          holdActive: true,
          message: undefined,
        });
        registeredCodeCount += 1;
      }
    }
    await refreshJobPhotoCounts(ctx, job);
    return { registeredCodeCount, discardedFileKeys };
  },
});

export const startImport = mutation({
  args: { jobExternalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ownedJob(ctx, args.jobExternalId);
    if (
      job.status === "completed" ||
      job.status === "validating" ||
      job.status === "importing" ||
      job.status === "retrying"
    ) {
      return null;
    }
    if (job.status === "canceled")
      throw new ConvexError("This import was canceled.");
    if (job.status === "failed") {
      throw new ConvexError("Retry this import instead of starting it again.");
    }
    if (
      job.stagedRowCount !== job.expectedRowCount ||
      job.readyPhotoCount !== job.expectedPhotoCount
    ) {
      throw new ConvexError(
        "Finish staging every product row and photo first.",
      );
    }
    await ctx.db.patch(job._id, {
      status: "validating",
      failureMessage: undefined,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, backfillCatalogKeysReference, {
      jobExternalId: job.externalId,
      table: "products",
      cursor: null,
    });
    return null;
  },
});

export const backfillCatalogKeys = internalMutation({
  args: {
    jobExternalId: v.string(),
    table: v.union(
      v.literal("products"),
      v.literal("categories"),
      v.literal("subcategories"),
    ),
    cursor: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("catalogImportJobs")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.jobExternalId),
      )
      .unique();
    if (!job || job.status !== "validating") return null;

    const page =
      args.table === "products"
        ? await ctx.db
            .query("products")
            .withIndex("by_part_code")
            .paginate({ cursor: args.cursor, numItems: BACKFILL_PAGE_SIZE })
        : args.table === "categories"
          ? await ctx.db
              .query("categories")
              .withIndex("by_name")
              .paginate({ cursor: args.cursor, numItems: BACKFILL_PAGE_SIZE })
          : await ctx.db
              .query("subcategories")
              .withIndex("by_name")
              .paginate({ cursor: args.cursor, numItems: BACKFILL_PAGE_SIZE });
    if (args.table === "products") {
      for (const product of page.page as Doc<"products">[]) {
        if (!product.normalizedPartCode) {
          await ctx.db.patch(product._id, {
            normalizedPartCode: normalizeKey(product.partCode),
          });
        }
      }
    } else if (args.table === "categories") {
      for (const category of page.page as Doc<"categories">[]) {
        if (!category.normalizedName) {
          await ctx.db.patch(category._id, {
            normalizedName: normalizeKey(category.name),
          });
        }
      }
    } else {
      for (const subcategory of page.page as Doc<"subcategories">[]) {
        if (!subcategory.normalizedName) {
          await ctx.db.patch(subcategory._id, {
            normalizedName: normalizeKey(subcategory.name),
          });
        }
      }
    }
    await ctx.db.patch(job._id, { updatedAt: Date.now() });
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, backfillCatalogKeysReference, {
        ...args,
        cursor: page.continueCursor,
      });
      return null;
    }
    if (args.table !== "subcategories") {
      await ctx.scheduler.runAfter(0, backfillCatalogKeysReference, {
        jobExternalId: job.externalId,
        table: args.table === "products" ? "categories" : "subcategories",
        cursor: null,
      });
    } else {
      await ctx.scheduler.runAfter(0, preflightImportReference, {
        jobExternalId: job.externalId,
        phase: "rows",
        cursor: null,
        conflictCount: 0,
        missingCategoryCount: 0,
        missingSubcategoryCount: 0,
      });
    }
    return null;
  },
});

export const preflightImport = internalMutation({
  args: {
    jobExternalId: v.string(),
    phase: v.union(
      v.literal("rows"),
      v.literal("categories"),
      v.literal("subcategories"),
    ),
    cursor: v.union(v.string(), v.null()),
    conflictCount: v.number(),
    missingCategoryCount: v.number(),
    missingSubcategoryCount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("catalogImportJobs")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.jobExternalId),
      )
      .unique();
    if (!job || job.status !== "validating") return null;

    if (args.phase === "rows") {
      const page = await ctx.db
        .query("catalogImportRows")
        .withIndex("by_job_and_row", (query) =>
          query.eq("jobExternalId", job.externalId),
        )
        .paginate({ cursor: args.cursor, numItems: ROW_PREFLIGHT_PAGE_SIZE });
      let conflictCount = args.conflictCount;
      for (const row of page.page) {
        if (row.status !== "pending") continue;
        const existing = await ctx.db
          .query("products")
          .withIndex("by_normalized_part_code", (query) =>
            query.eq("normalizedPartCode", row.normalizedPartCode),
          )
          .first();
        let message = existing
          ? "A product with this part code already exists."
          : null;
        for (const rawCode of message ? [] : row.product.photoCodes) {
          const code = normalizePhotoCode(rawCode);
          const photo = await ctx.db
            .query("catalogImportPhotos")
            .withIndex("by_job_and_code", (query) =>
              query.eq("jobExternalId", job.externalId).eq("code", code),
            )
            .unique();
          if (photo?.status !== "ready" || !photo.assetExternalId) {
            message = `Photo code ${code} is missing or not ready.`;
            break;
          }
          const assetExternalId = photo.assetExternalId;
          const asset = await ctx.db
            .query("productPhotoAssets")
            .withIndex("by_external_id", (query) =>
              query.eq("externalId", assetExternalId),
            )
            .unique();
          if (!asset || !isActiveAsset(asset)) {
            message = `Photo code ${code} has no active stored asset.`;
            break;
          }
        }
        if (message) {
          await ctx.db.patch(row._id, {
            status: "error",
            message,
          });
          conflictCount += 1;
        }
      }
      const newConflicts = conflictCount - args.conflictCount;
      await ctx.db.patch(job._id, {
        processedRowCount: job.processedRowCount + newConflicts,
        errorCount: job.errorCount + newConflicts,
        updatedAt: Date.now(),
      });
      if (!page.isDone) {
        await ctx.scheduler.runAfter(0, preflightImportReference, {
          ...args,
          conflictCount,
          cursor: page.continueCursor,
        });
      } else if (conflictCount > 0) {
        await ctx.db.patch(job._id, {
          status: "failed",
          failureMessage: `${conflictCount} row validation error${conflictCount === 1 ? "" : "s"} blocked this import before processing.`,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.scheduler.runAfter(0, preflightImportReference, {
          ...args,
          phase: "categories",
          cursor: null,
        });
      }
      return null;
    }

    if (args.phase === "categories") {
      const page = await ctx.db
        .query("catalogImportCategories")
        .withIndex("by_job", (query) =>
          query.eq("jobExternalId", job.externalId),
        )
        .paginate({ cursor: args.cursor, numItems: PAGE_SIZE });
      let missingCategoryCount = args.missingCategoryCount;
      for (const item of page.page) {
        const matches = await ctx.db
          .query("categories")
          .withIndex("by_normalized_name", (query) =>
            query.eq("normalizedName", item.normalizedName),
          )
          .take(2);
        if (matches.length > 1) {
          await ctx.db.patch(job._id, {
            status: "failed",
            failureMessage: `Multiple catalog categories normalize to ${item.name}.`,
            updatedAt: Date.now(),
          });
          return null;
        }
        if (matches.length === 0) missingCategoryCount += 1;
      }
      await ctx.db.patch(job._id, { updatedAt: Date.now() });
      if (!page.isDone) {
        await ctx.scheduler.runAfter(0, preflightImportReference, {
          ...args,
          missingCategoryCount,
          cursor: page.continueCursor,
        });
      } else {
        await ctx.scheduler.runAfter(0, preflightImportReference, {
          ...args,
          phase: "subcategories",
          cursor: null,
          missingCategoryCount,
        });
      }
      return null;
    }

    const page = await ctx.db
      .query("catalogImportSubcategories")
      .withIndex("by_job", (query) => query.eq("jobExternalId", job.externalId))
      .paginate({ cursor: args.cursor, numItems: PAGE_SIZE });
    let missingSubcategoryCount = args.missingSubcategoryCount;
    for (const item of page.page) {
      const category = await ctx.db
        .query("categories")
        .withIndex("by_normalized_name", (query) =>
          query.eq("normalizedName", item.categoryNormalizedName),
        )
        .first();
      if (!category) {
        missingSubcategoryCount += 1;
        continue;
      }
      const matches = await ctx.db
        .query("subcategories")
        .withIndex("by_category_and_normalized_name", (query) =>
          query
            .eq("categoryExternalId", category.externalId)
            .eq("normalizedName", item.normalizedName),
        )
        .take(2);
      if (matches.length > 1) {
        await ctx.db.patch(job._id, {
          status: "failed",
          failureMessage: `Multiple ${category.name} subcategories normalize to ${item.name}.`,
          updatedAt: Date.now(),
        });
        return null;
      }
      if (matches.length === 0) missingSubcategoryCount += 1;
    }
    await ctx.db.patch(job._id, { updatedAt: Date.now() });
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, preflightImportReference, {
        ...args,
        missingSubcategoryCount,
        cursor: page.continueCursor,
      });
      return null;
    }
    try {
      await assertCatalogCapacity(ctx, {
        products: job.expectedRowCount,
        categories: args.missingCategoryCount,
        subcategories: missingSubcategoryCount,
      });
    } catch (error) {
      await ctx.db.patch(job._id, {
        status: "failed",
        failureMessage: errorMessage(error),
        updatedAt: Date.now(),
      });
      return null;
    }
    const processingLeaseAt = Date.now();
    await ctx.db.patch(job._id, {
      status: "importing",
      failureMessage: undefined,
      processingLeaseAt,
      updatedAt: processingLeaseAt,
    });
    await ctx.scheduler.runAfter(0, processBatchReference, {
      jobExternalId: job.externalId,
    });
    await ctx.scheduler.runAfter(
      PROCESSING_WATCHDOG_MS,
      reconcileImportProgressReference,
      { jobExternalId: job.externalId, processingLeaseAt },
    );
    return null;
  },
});

export const pendingBatch = internalQuery({
  args: { jobExternalId: v.string() },
  returns: v.union(v.object({ rowNumbers: v.array(v.number()) }), v.null()),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("catalogImportJobs")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.jobExternalId),
      )
      .unique();
    if (!job || job.status !== "importing") return null;
    const rows = await ctx.db
      .query("catalogImportRows")
      .withIndex("by_job_and_status_and_row", (query) =>
        query.eq("jobExternalId", job.externalId).eq("status", "pending"),
      )
      .take(IMPORT_BATCH_SIZE);
    return { rowNumbers: rows.map((row) => row.rowNumber) };
  },
});

export const processImportRow = internalMutation({
  args: { jobExternalId: v.string(), rowNumber: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("catalogImportJobs")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.jobExternalId),
      )
      .unique();
    if (!job || job.status !== "importing") return null;
    const row = await ctx.db
      .query("catalogImportRows")
      .withIndex("by_job_and_row", (query) =>
        query
          .eq("jobExternalId", job.externalId)
          .eq("rowNumber", args.rowNumber),
      )
      .unique();
    if (!row || row.status !== "pending") return null;
    const product = row.product;
    const existing = await ctx.db
      .query("products")
      .withIndex("by_normalized_part_code", (query) =>
        query.eq("normalizedPartCode", row.normalizedPartCode),
      )
      .first();
    if (existing) {
      throw new ConvexError("A product with this part code already exists.");
    }

    const photoAssets: Array<{
      assetExternalId: string;
      code: string;
      url: string;
    }> = [];
    for (const rawCode of product.photoCodes) {
      const code = normalizePhotoCode(rawCode);
      const photo = await ctx.db
        .query("catalogImportPhotos")
        .withIndex("by_job_and_code", (query) =>
          query.eq("jobExternalId", job.externalId).eq("code", code),
        )
        .unique();
      if (photo?.status !== "ready" || !photo.assetExternalId) {
        throw new ConvexError(`Photo code ${code} is not ready.`);
      }
      const assetExternalId = photo.assetExternalId;
      const asset = await ctx.db
        .query("productPhotoAssets")
        .withIndex("by_external_id", (query) =>
          query.eq("externalId", assetExternalId),
        )
        .unique();
      if (!asset || !isActiveAsset(asset)) {
        throw new ConvexError(`Photo code ${code} has no active stored asset.`);
      }
      photoAssets.push({
        assetExternalId: asset.externalId,
        code,
        url: asset.canonicalUrl,
      });
    }

    const categoryKey = normalizeKey(product.categoryName);
    const subcategoryKey = normalizeKey(product.subcategoryName);
    let category = await ctx.db
      .query("categories")
      .withIndex("by_normalized_name", (query) =>
        query.eq("normalizedName", categoryKey),
      )
      .first();
    let subcategory = category
      ? await ctx.db
          .query("subcategories")
          .withIndex("by_category_and_normalized_name", (query) =>
            query
              .eq("categoryExternalId", category!.externalId)
              .eq("normalizedName", subcategoryKey),
          )
          .first()
      : null;
    await reserveCatalogCapacity(ctx, {
      products: 1,
      categories: category ? 0 : 1,
      subcategories: subcategory ? 0 : 1,
    });
    if (!category) {
      const id = await ctx.db.insert("categories", {
        externalId: crypto.randomUUID(),
        name: product.categoryName,
        normalizedName: categoryKey,
        description: "",
      });
      category = await ctx.db.get(id);
    }
    if (!category) throw new ConvexError("The category could not be created.");
    if (!subcategory) {
      const id = await ctx.db.insert("subcategories", {
        externalId: crypto.randomUUID(),
        name: product.subcategoryName,
        normalizedName: subcategoryKey,
        categoryExternalId: category.externalId,
      });
      subcategory = await ctx.db.get(id);
    }
    if (
      !subcategory ||
      subcategory.categoryExternalId !== category.externalId
    ) {
      throw new ConvexError("The subcategory does not belong to the category.");
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
    await ctx.db.patch(row._id, {
      status: "completed",
      message: "Imported successfully.",
    });
    await ctx.db.patch(job._id, {
      processedRowCount: job.processedRowCount + 1,
      createdProductCount: job.createdProductCount + 1,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const recordRowError = internalMutation({
  args: {
    jobExternalId: v.string(),
    rowNumber: v.number(),
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("catalogImportJobs")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.jobExternalId),
      )
      .unique();
    if (!job || job.status !== "importing") return null;
    const row = await ctx.db
      .query("catalogImportRows")
      .withIndex("by_job_and_row", (query) =>
        query
          .eq("jobExternalId", job.externalId)
          .eq("rowNumber", args.rowNumber),
      )
      .unique();
    if (!row || row.status !== "pending") return null;
    await ctx.db.patch(row._id, {
      status: "error",
      message: requiredText(args.message, "Import error", 1_000),
    });
    await ctx.db.patch(job._id, {
      processedRowCount: job.processedRowCount + 1,
      errorCount: job.errorCount + 1,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const finishImportBatch = internalMutation({
  args: { jobExternalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("catalogImportJobs")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.jobExternalId),
      )
      .unique();
    if (!job || job.status !== "importing") return null;
    const pending = await ctx.db
      .query("catalogImportRows")
      .withIndex("by_job_and_status_and_row", (query) =>
        query.eq("jobExternalId", job.externalId).eq("status", "pending"),
      )
      .first();
    if (pending) {
      const processingLeaseAt = Date.now();
      await ctx.db.patch(job._id, {
        processingLeaseAt,
        updatedAt: processingLeaseAt,
      });
      await ctx.scheduler.runAfter(0, processBatchReference, {
        jobExternalId: job.externalId,
      });
      await ctx.scheduler.runAfter(
        PROCESSING_WATCHDOG_MS,
        reconcileImportProgressReference,
        { jobExternalId: job.externalId, processingLeaseAt },
      );
      return null;
    }
    const errored = await ctx.db
      .query("catalogImportRows")
      .withIndex("by_job_and_status_and_row", (query) =>
        query.eq("jobExternalId", job.externalId).eq("status", "error"),
      )
      .first();
    if (errored) {
      await ctx.db.patch(job._id, {
        status: "failed",
        failureMessage: `${job.errorCount} product row${job.errorCount === 1 ? "" : "s"} could not be imported.`,
        processingLeaseAt: undefined,
        updatedAt: Date.now(),
      });
      return null;
    }
    await ctx.db.patch(job._id, {
      status: "completed",
      failureMessage: undefined,
      processingLeaseAt: undefined,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, releaseJobPhotoHoldsReference, {
      jobExternalId: job.externalId,
    });
    return null;
  },
});

export const processBatch = internalAction({
  args: { jobExternalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const batch = await ctx.runQuery(pendingBatchReference, args);
    if (!batch) return null;
    for (const rowNumber of batch.rowNumbers) {
      try {
        await ctx.runMutation(processImportRowReference, {
          jobExternalId: args.jobExternalId,
          rowNumber,
        });
      } catch (error) {
        await ctx.runMutation(recordRowErrorReference, {
          jobExternalId: args.jobExternalId,
          rowNumber,
          message: errorMessage(error),
        });
      }
    }
    await ctx.runMutation(finishImportBatchReference, args);
    return null;
  },
});

export const reconcileImportProgress = internalMutation({
  args: { jobExternalId: v.string(), processingLeaseAt: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("catalogImportJobs")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.jobExternalId),
      )
      .unique();
    if (
      !job ||
      job.status !== "importing" ||
      job.processingLeaseAt !== args.processingLeaseAt
    ) {
      return null;
    }
    await ctx.db.patch(job._id, {
      status: "failed",
      failureMessage:
        "Server processing stopped unexpectedly. Retry the unfinished rows.",
      processingLeaseAt: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const retryImport = mutation({
  args: { jobExternalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ownedJob(ctx, args.jobExternalId);
    if (job.status === "retrying") return null;
    const importingIsStale =
      job.status === "importing" &&
      (!job.processingLeaseAt ||
        job.processingLeaseAt <= Date.now() - PROCESSING_WATCHDOG_MS);
    if (job.status === "importing" && !importingIsStale) return null;
    if (job.status !== "failed" && !importingIsStale) {
      throw new ConvexError("Only a failed import can be retried.");
    }
    if (job.stagingPurgedAt) {
      throw new ConvexError("This import's staging data has expired.");
    }
    await ctx.db.patch(job._id, {
      status: "retrying",
      failureMessage: undefined,
      processingLeaseAt: undefined,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, resetErrorRowsReference, {
      jobExternalId: job.externalId,
    });
    return null;
  },
});

export const resetErrorRows = internalMutation({
  args: { jobExternalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("catalogImportJobs")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.jobExternalId),
      )
      .unique();
    if (!job || job.status !== "retrying") return null;
    const rows = await ctx.db
      .query("catalogImportRows")
      .withIndex("by_job_and_status_and_row", (query) =>
        query.eq("jobExternalId", job.externalId).eq("status", "error"),
      )
      .take(PAGE_SIZE);
    for (const row of rows) {
      await ctx.db.patch(row._id, { status: "pending", message: undefined });
    }
    if (rows.length > 0) {
      await ctx.db.patch(job._id, {
        processedRowCount: Math.max(0, job.processedRowCount - rows.length),
        errorCount: Math.max(0, job.errorCount - rows.length),
        updatedAt: Date.now(),
      });
      await ctx.scheduler.runAfter(0, resetErrorRowsReference, args);
      return null;
    }
    if (job.createdProductCount === 0) {
      await ctx.db.patch(job._id, {
        status: "validating",
        processingLeaseAt: undefined,
        updatedAt: Date.now(),
      });
      await ctx.scheduler.runAfter(0, backfillCatalogKeysReference, {
        jobExternalId: job.externalId,
        table: "products",
        cursor: null,
      });
    } else {
      const processingLeaseAt = Date.now();
      await ctx.db.patch(job._id, {
        status: "importing",
        processingLeaseAt,
        updatedAt: processingLeaseAt,
      });
      await ctx.scheduler.runAfter(0, processBatchReference, args);
      await ctx.scheduler.runAfter(
        PROCESSING_WATCHDOG_MS,
        reconcileImportProgressReference,
        { jobExternalId: job.externalId, processingLeaseAt },
      );
    }
    return null;
  },
});

export const cancelImport = mutation({
  args: { jobExternalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ownedJob(ctx, args.jobExternalId);
    if (job.status === "completed" || job.status === "canceled") return null;
    await ctx.db.patch(job._id, {
      status: "canceled",
      failureMessage: "Canceled by an administrator.",
      processingLeaseAt: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const releaseJobPhotoHolds = internalMutation({
  args: { jobExternalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("catalogImportJobs")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.jobExternalId),
      )
      .unique();
    if (!job || isActiveJobStatus(job.status)) return null;
    const held = await ctx.db
      .query("catalogImportPhotos")
      .withIndex("by_job_and_hold", (query) =>
        query.eq("jobExternalId", job.externalId).eq("holdActive", true),
      )
      .take(PAGE_SIZE);
    for (const photo of held)
      await ctx.db.patch(photo._id, { holdActive: false });
    if (held.length > 0) {
      await ctx.scheduler.runAfter(0, releaseJobPhotoHoldsReference, args);
    }
    return null;
  },
});

export const startCleanup = mutation({
  args: {},
  returns: v.object({ staleBefore: v.number() }),
  handler: async (ctx) => {
    await requireIdentity(ctx);
    const staleBefore = await scheduleCatalogCleanup(ctx);
    return { staleBefore };
  },
});

export const startScheduledCleanup = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await scheduleCatalogCleanup(ctx);
    return null;
  },
});

export const resumeJobPhotoSweeps = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const jobs = await ctx.db
      .query("catalogImportJobs")
      .withIndex("by_provider_cleanup_pending", (query) =>
        query.eq("providerCleanupPending", true),
      )
      .take(20);
    for (const job of jobs) {
      if (!job.cleanupLockedAt || !job.providerCleanupPhase) continue;
      await ctx.scheduler.runAfter(0, sweepJobUploadsReference, {
        cleanupLockedAt: job.cleanupLockedAt,
        jobExternalId: job.externalId,
        offset: 0,
        phase: job.providerCleanupPhase,
      });
    }
    return null;
  },
});

export const cleanupExpiredJobs = internalMutation({
  args: { staleBefore: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const status of ["staging", "ready"] as const) {
      const abandoned = await ctx.db
        .query("catalogImportJobs")
        .withIndex("by_status_and_updated_at", (query) =>
          query.eq("status", status).lte("updatedAt", args.staleBefore),
        )
        .first();
      if (abandoned) {
        await ctx.db.patch(abandoned._id, {
          status: "canceled",
          failureMessage: "Canceled after seven days without activity.",
        });
        await ctx.scheduler.runAfter(0, cleanupExpiredJobsReference, args);
        return null;
      }
    }

    for (const status of ["completed", "failed", "canceled"] as const) {
      const job = await ctx.db
        .query("catalogImportJobs")
        .withIndex("by_status_and_staging_retained_and_updated_at", (query) =>
          query
            .eq("status", status)
            .eq("stagingRetained", true)
            .lte("updatedAt", args.staleBefore),
        )
        .first();
      if (!job) continue;
      if (!job.cleanupLockedAt) {
        const cleanupLockedAt = Date.now();
        await ctx.db.patch(job._id, {
          cleanupLockedAt,
          providerCleanupPending: true,
          providerCleanupPhase: "initial",
        });
        await ctx.scheduler.runAfter(0, sweepJobUploadsReference, {
          cleanupLockedAt,
          jobExternalId: job.externalId,
          offset: 0,
          phase: "initial",
        });
      }
      const held = await ctx.db
        .query("catalogImportPhotos")
        .withIndex("by_job_and_hold", (query) =>
          query.eq("jobExternalId", job.externalId).eq("holdActive", true),
        )
        .take(PAGE_SIZE);
      if (held.length > 0) {
        for (const photo of held)
          await ctx.db.patch(photo._id, { holdActive: false });
        await ctx.scheduler.runAfter(0, cleanupExpiredJobsReference, args);
        return null;
      }

      const rows = await ctx.db
        .query("catalogImportRows")
        .withIndex("by_job_and_row", (query) =>
          query.eq("jobExternalId", job.externalId),
        )
        .take(PAGE_SIZE);
      if (rows.length > 0) {
        for (const row of rows) await ctx.db.delete(row._id);
        await ctx.scheduler.runAfter(0, cleanupExpiredJobsReference, args);
        return null;
      }
      const categories = await ctx.db
        .query("catalogImportCategories")
        .withIndex("by_job", (query) =>
          query.eq("jobExternalId", job.externalId),
        )
        .take(PAGE_SIZE);
      if (categories.length > 0) {
        for (const category of categories) await ctx.db.delete(category._id);
        await ctx.scheduler.runAfter(0, cleanupExpiredJobsReference, args);
        return null;
      }
      const subcategories = await ctx.db
        .query("catalogImportSubcategories")
        .withIndex("by_job", (query) =>
          query.eq("jobExternalId", job.externalId),
        )
        .take(PAGE_SIZE);
      if (subcategories.length > 0) {
        for (const subcategory of subcategories)
          await ctx.db.delete(subcategory._id);
        await ctx.scheduler.runAfter(0, cleanupExpiredJobsReference, args);
        return null;
      }
      const photos = await ctx.db
        .query("catalogImportPhotos")
        .withIndex("by_job_and_status", (query) =>
          query.eq("jobExternalId", job.externalId),
        )
        .take(PAGE_SIZE);
      if (photos.length > 0) {
        for (const photo of photos) await ctx.db.delete(photo._id);
        await ctx.scheduler.runAfter(0, cleanupExpiredJobsReference, args);
        return null;
      }
      await ctx.db.patch(job._id, {
        stagingRetained: false,
        stagingPurgedAt: Date.now(),
      });
      await ctx.scheduler.runAfter(0, cleanupExpiredJobsReference, args);
      return null;
    }

    await ctx.scheduler.runAfter(0, markUnlinkedPhotoAssetsReference, {
      staleBefore: args.staleBefore,
      cursor: null,
    });
    return null;
  },
});

export const markUnlinkedPhotoAssets = internalMutation({
  args: { staleBefore: v.number(), cursor: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("productPhotoAssets")
      .withIndex("by_created_at", (query) =>
        query.lte("createdAt", args.staleBefore),
      )
      .paginate({ cursor: args.cursor, numItems: 25 });
    for (const asset of page.page) {
      if (asset.lifecycle === "deleted") {
        continue;
      }
      if (asset.lifecycle === "deleting") {
        if (
          asset.deleteAttemptedAt &&
          asset.deleteAttemptedAt > args.staleBefore
        ) {
          continue;
        }
      } else if (
        !isActiveAsset(asset) ||
        (asset.deleteAttemptedAt && asset.deleteAttemptedAt > args.staleBefore)
      ) {
        continue;
      }
      const [link, hold] = await Promise.all([
        ctx.db
          .query("productPhotoLinks")
          .withIndex("by_asset_external_id", (query) =>
            query.eq("assetExternalId", asset.externalId),
          )
          .first(),
        ctx.db
          .query("catalogImportPhotos")
          .withIndex("by_asset_and_hold", (query) =>
            query
              .eq("assetExternalId", asset.externalId)
              .eq("holdActive", true),
          )
          .first(),
      ]);
      if (link || hold) continue;
      const deleteAttemptedAt = Date.now();
      const deleteRetryCount =
        asset.lifecycle === "deleting" ? (asset.deleteRetryCount ?? 0) + 1 : 0;
      await ctx.db.patch(asset._id, {
        lifecycle: "deleting",
        deleteAttemptedAt,
        deleteRetryCount,
        deletionError: undefined,
      });
      await schedulePhotoAssetDeletionAttempt(
        ctx,
        asset.externalId,
        deleteAttemptedAt,
        deleteRetryCount,
      );
    }
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, markUnlinkedPhotoAssetsReference, {
        ...args,
        cursor: page.continueCursor,
      });
    }
    return null;
  },
});

export const getDeletingPhotoAsset = internalQuery({
  args: { assetExternalId: v.string() },
  returns: v.union(v.object({ fileKeys: v.array(v.string()) }), v.null()),
  handler: async (ctx, args) => {
    const asset = await ctx.db
      .query("productPhotoAssets")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.assetExternalId),
      )
      .unique();
    return asset?.lifecycle === "deleting"
      ? { fileKeys: asset.variants.map((variant) => variant.fileKey) }
      : null;
  },
});

export const completePhotoAssetDeletion = internalMutation({
  args: { assetExternalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const asset = await ctx.db
      .query("productPhotoAssets")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.assetExternalId),
      )
      .unique();
    if (!asset || asset.lifecycle !== "deleting") return null;
    await ctx.db.patch(asset._id, {
      lifecycle: "deleted",
      deletedAt: Date.now(),
      deleteRetryCount: undefined,
      deletionError: undefined,
    });
    await ctx.scheduler.runAfter(0, clearDeletedAssetBindingsReference, args);
    return null;
  },
});

export const clearDeletedAssetBindings = internalMutation({
  args: { assetExternalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const asset = await ctx.db
      .query("productPhotoAssets")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.assetExternalId),
      )
      .unique();
    if (!asset || asset.lifecycle !== "deleted") return null;
    const bindings = await ctx.db
      .query("productPhotoCodes")
      .withIndex("by_asset_external_id", (query) =>
        query.eq("assetExternalId", asset.externalId),
      )
      .take(PAGE_SIZE);
    for (const binding of bindings) {
      await ctx.db.patch(binding._id, { assetExternalId: undefined });
    }
    if (bindings.length > 0) {
      await ctx.scheduler.runAfter(0, clearDeletedAssetBindingsReference, args);
    }
    return null;
  },
});

export const failPhotoAssetDeletion = internalMutation({
  args: { assetExternalId: v.string(), message: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const asset = await ctx.db
      .query("productPhotoAssets")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.assetExternalId),
      )
      .unique();
    if (!asset || asset.lifecycle !== "deleting") return null;
    await ctx.db.patch(asset._id, {
      deletionError: requiredText(args.message, "Deletion error", 1_000),
    });
    return null;
  },
});

export const reconcilePhotoAssetDeletion = internalMutation({
  args: { assetExternalId: v.string(), deleteAttemptedAt: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const asset = await ctx.db
      .query("productPhotoAssets")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.assetExternalId),
      )
      .unique();
    if (
      !asset ||
      asset.lifecycle !== "deleting" ||
      asset.deleteAttemptedAt !== args.deleteAttemptedAt
    ) {
      return null;
    }
    const deleteAttemptedAt = Date.now();
    const deleteRetryCount = (asset.deleteRetryCount ?? 0) + 1;
    await ctx.db.patch(asset._id, {
      deleteAttemptedAt,
      deleteRetryCount,
    });
    await schedulePhotoAssetDeletionAttempt(
      ctx,
      asset.externalId,
      deleteAttemptedAt,
      deleteRetryCount,
    );
    return null;
  },
});

export const classifyJobPhotoUploads = internalQuery({
  args: {
    cleanupLockedAt: v.number(),
    files: v.array(v.object({ contentHash: v.string(), fileKey: v.string() })),
    jobExternalId: v.string(),
    phase: v.union(v.literal("initial"), v.literal("final")),
  },
  returns: v.union(
    v.object({ deletableFileKeys: v.array(v.string()) }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("catalogImportJobs")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.jobExternalId),
      )
      .unique();
    if (
      !job ||
      job.cleanupLockedAt !== args.cleanupLockedAt ||
      !job.providerCleanupPending ||
      job.providerCleanupPhase !== args.phase
    ) {
      return null;
    }
    const deletableFileKeys: string[] = [];
    for (const file of args.files) {
      const contentHash = normalizeContentHash(file.contentHash);
      const asset = await ctx.db
        .query("productPhotoAssets")
        .withIndex("by_content_hash", (query) =>
          query.eq("contentHash", contentHash),
        )
        .first();
      if (
        asset &&
        asset.variants.some((variant) => variant.fileKey === file.fileKey)
      ) {
        continue;
      }
      deletableFileKeys.push(file.fileKey);
    }
    return { deletableFileKeys };
  },
});

export const completeJobPhotoSweep = internalMutation({
  args: {
    cleanupLockedAt: v.number(),
    jobExternalId: v.string(),
    phase: v.union(v.literal("initial"), v.literal("final")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("catalogImportJobs")
      .withIndex("by_external_id", (query) =>
        query.eq("externalId", args.jobExternalId),
      )
      .unique();
    if (
      !job ||
      job.cleanupLockedAt !== args.cleanupLockedAt ||
      !job.providerCleanupPending ||
      job.providerCleanupPhase !== args.phase
    ) {
      return null;
    }
    if (args.phase === "initial") {
      await ctx.db.patch(job._id, { providerCleanupPhase: "final" });
      await ctx.scheduler.runAfter(
        PROVIDER_FINAL_SWEEP_DELAY_MS,
        sweepJobUploadsReference,
        {
          cleanupLockedAt: args.cleanupLockedAt,
          jobExternalId: job.externalId,
          offset: 0,
          phase: "final",
        },
      );
    } else {
      await ctx.db.patch(job._id, {
        providerCleanupCompletedAt: Date.now(),
        providerCleanupPending: false,
        providerCleanupPhase: undefined,
      });
    }
    return null;
  },
});

export const listRowResults = query({
  args: { jobExternalId: v.string(), paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(
      v.object({
        rowNumber: v.number(),
        partCode: v.string(),
        productName: v.string(),
        status: rowStatusValidator,
        message: v.union(v.string(), v.null()),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const job = await ownedJob(ctx, args.jobExternalId);
    if (
      !Number.isInteger(args.paginationOpts.numItems) ||
      args.paginationOpts.numItems < 1 ||
      args.paginationOpts.numItems > 100
    ) {
      throw new ConvexError("Request between 1 and 100 import rows at a time.");
    }
    const result = await ctx.db
      .query("catalogImportRows")
      .withIndex("by_job_and_row", (query) =>
        query.eq("jobExternalId", job.externalId),
      )
      .paginate(args.paginationOpts);
    return {
      continueCursor: result.continueCursor,
      isDone: result.isDone,
      page: result.page.map((row) => ({
        rowNumber: row.rowNumber,
        partCode: row.product.partCode,
        productName: row.product.productName,
        status: row.status,
        message: row.message ?? null,
      })),
    };
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
    stagingPurgedAt: v.union(v.number(), v.null()),
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
      stagingPurgedAt: job.stagingPurgedAt ?? null,
    };
  },
});
