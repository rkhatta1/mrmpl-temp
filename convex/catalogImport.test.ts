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
const getProduct = makeFunctionReference<
  "query",
  { externalId: string },
  any
>("catalogAdmin:getProduct");

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
const getJob = makeFunctionReference<"query", any, any>(
  "catalogImport:getJob",
);
const processBatch = makeFunctionReference<"mutation", any, null>(
  "catalogImport:processBatch",
);
const backfillProductKeys = makeFunctionReference<"mutation", any, null>(
  "catalogImport:backfillProductKeys",
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

function uploadedAsset(contentHash: string) {
  const variants = [480, 768, 880, 1080].map((width) => ({
    width,
    customId: `mrmpl-bulk-product-photo-${contentHash}-${width}-webp`,
    fileKey: `${contentHash}-${width}`,
    size: 1024,
    url: `https://unit-test.ufs.sh/f/mrmpl-bulk-product-photo-${contentHash}-${width}-webp`,
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
  if (resolution.uploads.length > 0) {
    await asAdmin.mutation(registerUploadedPhotos, {
      assets: resolution.uploads.map(({ contentHash }: { contentHash: string }) =>
        uploadedAsset(contentHash),
      ),
      jobExternalId: created.externalId,
    });
  }
  await asAdmin.mutation(startImport, { jobExternalId: created.externalId });
  await t.mutation(backfillProductKeys, {
    cursor: null,
    jobExternalId: created.externalId,
  });
  for (let iteration = 0; iteration < 10; iteration += 1) {
    const job = await asAdmin.query(getJob, { jobExternalId: created.externalId });
    if (job.status === "completed") break;
    await t.mutation(processBatch, { jobExternalId: created.externalId });
  }
  return {
    job: await asAdmin.query(getJob, { jobExternalId: created.externalId }),
    resolution,
  };
}

describe("catalog bulk import", () => {
  test("deduplicates taxonomy, products, and shared photo bytes across replayed jobs", async () => {
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
      product(2, "BULK-001", " valves ", "ball", ["PHOTO-A", "PHOTO-B"]),
      product(3, "BULK-002", "Valves", "Needle", ["PHOTO-B"]),
      product(4, "BULK-003", "Pumps", "Centrifugal", ["PHOTO-C"]),
      product(5, "bulk-001", "VALVES", "BALL", ["PHOTO-A"]),
    ];

    const first = await runJob(t, rows);
    expect(first.resolution.uploads.map((item: any) => item.contentHash).sort()).toEqual(
      [HASH_A, HASH_C],
    );
    expect(first.job).toMatchObject({
      status: "completed",
      createdProductCount: 3,
      skippedProductCount: 1,
      distinctPhotoAssetCount: 2,
      readyPhotoCount: 3,
    });

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
      externalId: catalog.products.find((item: any) => item.partCode === "BULK-001")
        .externalId,
    });
    const secondProduct = await asAdmin.query(getProduct, {
      externalId: catalog.products.find((item: any) => item.partCode === "BULK-002")
        .externalId,
    });
    expect(firstProduct.images).toEqual(secondProduct.images);
    expect(firstProduct.images).toHaveLength(1);

    const replay = await runJob(t, rows.slice(0, 3));
    expect(replay.resolution.uploads).toEqual([]);
    expect(replay.job).toMatchObject({
      status: "completed",
      createdProductCount: 0,
      skippedProductCount: 3,
      distinctPhotoAssetCount: 2,
      readyPhotoCount: 3,
    });
    expect((await asAdmin.query(listCatalog, {})).products).toHaveLength(3);
  });
});
