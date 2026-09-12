/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test } from "bun:test";
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";

import schema from "./schema";

const modules = {
  "./catalogAdmin.ts": () => import("./catalogAdmin"),
  "./catalogImport.ts": () => import("./catalogImport"),
  "./_generated/server.js": () => import("./_generated/server.js"),
};

const createCategory = makeFunctionReference<
  "mutation",
  { name: string; description: string },
  { externalId: string }
>("catalogAdmin:createCategory");
const createSubcategory = makeFunctionReference<
  "mutation",
  { name: string; categoryExternalId: string },
  { externalId: string }
>("catalogAdmin:createSubcategory");
const listCatalog = makeFunctionReference<"query", Record<string, never>, any>(
  "catalogAdmin:listCatalog",
);
const getProduct = makeFunctionReference<"query", { externalId: string }, any>(
  "catalogAdmin:getProduct",
);
const updateProduct = makeFunctionReference<"mutation", any, null>(
  "catalogAdmin:updateProduct",
);

const createJob = makeFunctionReference<"mutation", any, any>(
  "catalogImport:createJob",
);
const stageRows = makeFunctionReference<"mutation", any, any>(
  "catalogImport:stageRows",
);
const resolvePhotos = makeFunctionReference<"mutation", any, any>(
  "catalogImport:resolvePhotos",
);
const registerUploadedPhotos = makeFunctionReference<"mutation", any, any>(
  "catalogImport:registerUploadedPhotos",
);
const startImport = makeFunctionReference<"mutation", any, any>(
  "catalogImport:startImport",
);
const getJob = makeFunctionReference<"query", any, any>("catalogImport:getJob");
const authorizePhotoUpload = makeFunctionReference<"query", any, null>(
  "catalogImport:authorizePhotoUpload",
);
const listRowResults = makeFunctionReference<"query", any, any>(
  "catalogImport:listRowResults",
);

const HASH_A = "a".repeat(64);
const HASH_C = "c".repeat(64);

function product(
  rowNumber: number,
  partCode: string,
  categoryName: string,
  subcategoryName: string,
  photoCodes: string[],
) {
  return {
    rowNumber,
    productName: `Fixture product ${partCode}`,
    partCode,
    categoryName,
    subcategoryName,
    size: "1/2 in",
    material: "Brass",
    type: "Fixture",
    finishPlating: "Natural",
    threadStandard: "NPT",
    sealant: "",
    temperature: "-20 C to 120 C",
    pressure: "150 PSI",
    connections: "Threaded",
    assemblies: "",
    grade: "C360",
    description: "Bulk import fixture.",
    applications: ["Testing"],
    certifications: ["ISO 9001"],
    additionalNotes: [],
    dimensions: [{ parameter: "OD", value: "12 mm" }],
    photoCodes,
    isActive: true,
  };
}

function uploadedAsset(jobExternalId: string, contentHash: string) {
  const variants = [480, 768, 880, 1080].map((width) => ({
    width,
    customId: `mrmpl-bulk-${jobExternalId}-${contentHash}-${width}-webp`,
    fileKey: `${contentHash}-${width}`,
    size: 1024,
    url: `https://unit-test.ufs.sh/f/mrmpl-bulk-${jobExternalId}-${contentHash}-${width}-webp`,
  }));
  return {
    contentHash,
    canonicalUrl: variants[3].url,
    variants,
  };
}

async function runJob(
  t: ReturnType<typeof convexTest>,
  rows: ReturnType<typeof product>[],
) {
  const asAdmin = t.withIdentity({ name: "Admin" });
  const created = await asAdmin.mutation(createJob, {
    expectedPhotoCount: 3,
    expectedRowCount: rows.length,
    workbookName: "fixture.xlsx",
  });
  await asAdmin.mutation(stageRows, {
    jobExternalId: created.externalId,
    rows,
  });
  const resolution = await asAdmin.mutation(resolvePhotos, {
    jobExternalId: created.externalId,
    photos: [
      { code: "PHOTO-A", contentHash: HASH_A, sourceName: "PHOTO-A.png" },
      { code: "PHOTO-B", contentHash: HASH_A, sourceName: "PHOTO-B.png" },
      { code: "PHOTO-C", contentHash: HASH_C, sourceName: "PHOTO-C.png" },
    ],
  });
  const repeatedResolution = await asAdmin.mutation(resolvePhotos, {
    jobExternalId: created.externalId,
    photos: [
      { code: "PHOTO-A", contentHash: HASH_A, sourceName: "PHOTO-A.png" },
      { code: "PHOTO-B", contentHash: HASH_A, sourceName: "PHOTO-B.png" },
      { code: "PHOTO-C", contentHash: HASH_C, sourceName: "PHOTO-C.png" },
    ],
  });
  await asAdmin.query(authorizePhotoUpload, {
    contentHashes: resolution.uploads.map(
      ({ contentHash }: { contentHash: string }) => contentHash,
    ),
    jobExternalId: created.externalId,
  });
  if (resolution.uploads.length > 0) {
    await asAdmin.mutation(registerUploadedPhotos, {
      assets: resolution.uploads.map(
        ({ contentHash }: { contentHash: string }) =>
          uploadedAsset(created.externalId, contentHash),
      ),
      jobExternalId: created.externalId,
    });
  }
  await asAdmin.mutation(startImport, { jobExternalId: created.externalId });
  await t.finishAllScheduledFunctions(() => {});
  return {
    job: await asAdmin.query(getJob, { jobExternalId: created.externalId }),
    repeatedResolution,
    resolution,
    rows: await asAdmin.query(listRowResults, {
      jobExternalId: created.externalId,
      paginationOpts: { cursor: null, numItems: 100 },
    }),
  };
}

describe("catalog bulk import", () => {
  test("creates taxonomy and products atomically while preserving photo-code order", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = t.withIdentity({ name: "Admin" });
    const existingCategory = await asAdmin.mutation(createCategory, {
      description: "",
      name: "Valves",
    });
    await asAdmin.mutation(createSubcategory, {
      categoryExternalId: existingCategory.externalId,
      name: "Ball",
    });

    const rows = [
      product(2, "90-001-001", " valves ", "ball", ["PHOTO-A", "PHOTO-B"]),
      product(3, "90-001-002", "Valves", "Needle", ["PHOTO-B"]),
      product(4, "90-001-003", "Pumps", "Centrifugal", ["PHOTO-C"]),
    ];

    const first = await runJob(t, rows);
    expect(
      first.resolution.uploads.map((item: any) => item.contentHash).sort(),
    ).toEqual([HASH_A, HASH_C]);
    expect(
      first.repeatedResolution.uploads
        .map((item: any) => item.contentHash)
        .sort(),
    ).toEqual([HASH_A, HASH_C]);
    expect(first.job).toMatchObject({
      status: "completed",
      createdProductCount: 3,
      skippedProductCount: 0,
      distinctPhotoAssetCount: 2,
      readyPhotoCount: 3,
    });
    expect(first.rows.page.map((row: any) => row.rowNumber)).toEqual([2, 3, 4]);
    expect(
      first.rows.page.every((row: any) => row.status === "completed"),
    ).toBe(true);

    const catalog = await asAdmin.query(listCatalog, {});
    expect(catalog.categories.map((item: any) => item.name).sort()).toEqual([
      "Pumps",
      "Valves",
    ]);
    expect(catalog.subcategories.map((item: any) => item.name).sort()).toEqual([
      "Ball",
      "Centrifugal",
      "Needle",
    ]);
    expect(catalog.products).toHaveLength(3);

    const firstProduct = await asAdmin.query(getProduct, {
      externalId: catalog.products.find(
        (item: any) => item.partCode === "90-001-001",
      ).externalId,
    });
    const secondProduct = await asAdmin.query(getProduct, {
      externalId: catalog.products.find(
        (item: any) => item.partCode === "90-001-002",
      ).externalId,
    });
    expect(firstProduct.images).toHaveLength(2);
    expect(firstProduct.images[0]).toBe(firstProduct.images[1]);
    expect(secondProduct.images).toEqual([firstProduct.images[1]]);

    const firstProductExternalId = firstProduct.externalId;
    const firstProductInput = { ...firstProduct };
    delete firstProductInput.createdAt;
    delete firstProductInput.externalId;
    await asAdmin.mutation(updateProduct, {
      externalId: firstProductExternalId,
      product: {
        ...firstProductInput,
        images: [
          "https://example.com/manual.webp",
          `${firstProduct.images[0].replace("-1080-webp", "-480-webp")}?download=1`,
          firstProduct.images[1],
        ],
      },
    });
    expect(
      await t.run(async (ctx) => {
        const links = await ctx.db
          .query("productPhotoLinks")
          .withIndex("by_product_and_position", (query) =>
            query.eq("productExternalId", firstProductExternalId),
          )
          .collect();
        const stored = await ctx.db
          .query("products")
          .withIndex("by_external_id", (query) =>
            query.eq("externalId", firstProductExternalId),
          )
          .unique();
        return {
          codes: links.map((link) => link.code),
          positions: links.map((link) => link.position),
          productPhotoCodes: stored?.photoCodes,
        };
      }),
    ).toEqual({
      codes: ["PHOTO-A", "PHOTO-B"],
      positions: [1, 2],
      productPhotoCodes: ["PHOTO-A", "PHOTO-B"],
    });
    await expect(
      asAdmin.mutation(updateProduct, {
        externalId: firstProductExternalId,
        product: {
          ...firstProductInput,
          images: [firstProduct.images[0].replace(HASH_A, "f".repeat(64))],
        },
      }),
    ).rejects.toThrow("no longer available");
  });

  test("rejects invalid part codes and missing row photos before publishing", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = t.withIdentity({ name: "Admin" });
    const invalid = await asAdmin.mutation(createJob, {
      expectedPhotoCount: 0,
      expectedRowCount: 1,
      workbookName: "invalid.xlsx",
    });
    expect(
      asAdmin.mutation(stageRows, {
        jobExternalId: invalid.externalId,
        rows: [product(8, "INVALID", "Valves", "Ball", [])],
      }),
    ).rejects.toThrow("Part code must use the NN-NNN-NNN format");

    const created = await asAdmin.mutation(createJob, {
      expectedPhotoCount: 0,
      expectedRowCount: 2,
      workbookName: "missing-photo.xlsx",
    });
    await asAdmin.mutation(stageRows, {
      jobExternalId: created.externalId,
      rows: [
        product(21, "90-002-001", "Valves", "Ball", []),
        product(22, "90-002-002", "Blocked category", "Blocked subcategory", [
          "PHOTO-MISSING",
        ]),
      ],
    });
    await asAdmin.mutation(startImport, { jobExternalId: created.externalId });
    await t.finishAllScheduledFunctions(() => {});

    const job = await asAdmin.query(getJob, {
      jobExternalId: created.externalId,
    });
    const rows = await asAdmin.query(listRowResults, {
      jobExternalId: created.externalId,
      paginationOpts: { cursor: null, numItems: 100 },
    });
    expect(job).toMatchObject({
      status: "failed",
      createdProductCount: 0,
      errorCount: 1,
    });
    expect(rows.page).toEqual([
      expect.objectContaining({ rowNumber: 21, status: "pending" }),
      expect.objectContaining({
        rowNumber: 22,
        status: "error",
        message: "Photo code PHOTO-MISSING is missing or not ready.",
      }),
    ]);
    const catalog = await asAdmin.query(listCatalog, {});
    expect(catalog.products).toHaveLength(0);
    expect(catalog.categories).toHaveLength(0);
    expect(catalog.subcategories).toHaveLength(0);
  });
});
