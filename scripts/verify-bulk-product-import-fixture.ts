/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { readSheet } from "read-excel-file/node";

import schema from "../convex/schema";
import { parseBulkProductSheet } from "../src/lib/bulk-product-upload";

const fixtureDirectory = path.resolve("outputs/bulk-product-upload-local-test");
const workbookPath = path.join(
  fixtureDirectory,
  "mrmpl-bulk-import-local-test.xlsx",
);
const photoDirectory = path.join(fixtureDirectory, "photos");
const modules = {
  "./catalogAdmin.ts": () => import("../convex/catalogAdmin"),
  "./catalogImport.ts": () => import("../convex/catalogImport"),
  "./_generated/server.js": () => import("../convex/_generated/server.js"),
};

const createJob = makeFunctionReference<"mutation", any, any>("catalogImport:createJob");
const stageRows = makeFunctionReference<"mutation", any, any>("catalogImport:stageRows");
const resolvePhotos = makeFunctionReference<"mutation", any, any>("catalogImport:resolvePhotos");
const registerUploadedPhotos = makeFunctionReference<"mutation", any, any>(
  "catalogImport:registerUploadedPhotos",
);
const startImport = makeFunctionReference<"mutation", any, null>("catalogImport:startImport");
const processBatch = makeFunctionReference<"mutation", any, null>("catalogImport:processBatch");
const backfillProductKeys = makeFunctionReference<"mutation", any, null>(
  "catalogImport:backfillProductKeys",
);
const getJob = makeFunctionReference<"query", any, any>("catalogImport:getJob");
const listCatalog = makeFunctionReference<"query", Record<string, never>, any>(
  "catalogAdmin:listCatalog",
);

function chunks<Value>(values: Value[], size: number) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, (index + 1) * size),
  );
}

function uploadedAsset(contentHash: string) {
  const variants = [480, 768, 880, 1080].map((width) => ({
    width,
    customId: `mrmpl-bulk-product-photo-${contentHash}-${width}-webp`,
    fileKey: `local-fixture-${contentHash}-${width}`,
    size: 2048,
    url: `https://local-fixture.ufs.sh/f/mrmpl-bulk-product-photo-${contentHash}-${width}-webp`,
  }));
  return { contentHash, canonicalUrl: variants[3].url, variants };
}

const sheet = await readSheet(workbookPath, "Products");
const parsed = parseBulkProductSheet(sheet);
if (parsed.issues.length > 0) {
  throw new Error(`Workbook validation failed: ${JSON.stringify(parsed.issues.slice(0, 5))}`);
}

const photoFiles = (await readdir(photoDirectory)).filter((name) => name.endsWith(".png"));
const photos = await Promise.all(
  photoFiles.map(async (sourceName) => {
    const bytes = await readFile(path.join(photoDirectory, sourceName));
    return {
      code: sourceName.replace(/\.png$/i, ""),
      contentHash: createHash("sha256").update(bytes).digest("hex"),
      sourceName,
    };
  }),
);
const distinctHashes = new Set(photos.map((photo) => photo.contentHash));
const categories = new Set(parsed.rows.map((row) => row.categoryName));
const subcategories = new Set(
  parsed.rows.map((row) => `${row.categoryName}:${row.subcategoryName}`),
);
const photoUsage = new Map<string, number>();
for (const row of parsed.rows) {
  for (const code of row.photoCodes) {
    photoUsage.set(code, (photoUsage.get(code) ?? 0) + 1);
  }
}
if (
  parsed.rows.length !== 176 ||
  categories.size !== 5 ||
  subcategories.size !== 24 ||
  photos.length !== 12 ||
  distinctHashes.size !== 11 ||
  Math.min(...photoUsage.values()) < 50
) {
  throw new Error("The generated fixture does not match its requested scale or dedupe shape.");
}

const t = convexTest(schema, modules);
const asAdmin = t.withIdentity({ name: "Local fixture verifier" });

async function runImport() {
  const job = await asAdmin.mutation(createJob, {
    expectedPhotoCount: photos.length,
    expectedRowCount: parsed.rows.length,
    workbookName: path.basename(workbookPath),
  });
  for (const rows of chunks(parsed.rows, 50)) {
    await asAdmin.mutation(stageRows, { jobExternalId: job.externalId, rows });
  }
  const requestedUploads = [];
  for (const photoBatch of chunks(photos, 100)) {
    const result = await asAdmin.mutation(resolvePhotos, {
      jobExternalId: job.externalId,
      photos: photoBatch,
    });
    requestedUploads.push(...result.uploads);
  }
  for (const uploadBatch of chunks(requestedUploads, 10)) {
    await asAdmin.mutation(registerUploadedPhotos, {
      jobExternalId: job.externalId,
      assets: uploadBatch.map((upload: { contentHash: string }) =>
        uploadedAsset(upload.contentHash),
      ),
    });
  }
  await asAdmin.mutation(startImport, { jobExternalId: job.externalId });
  await t.mutation(backfillProductKeys, {
    cursor: null,
    jobExternalId: job.externalId,
  });
  for (let iteration = 0; iteration < 130; iteration += 1) {
    const current = await asAdmin.query(getJob, { jobExternalId: job.externalId });
    if (current.status === "completed") {
      return { current, uploadCount: requestedUploads.length };
    }
    await t.mutation(processBatch, { jobExternalId: job.externalId });
  }
  throw new Error("The local import did not complete within its batch limit.");
}

const first = await runImport();
const replay = await runImport();
const catalog = await asAdmin.query(listCatalog, {});
if (
  first.uploadCount !== 11 ||
  first.current.createdProductCount !== 176 ||
  replay.uploadCount !== 0 ||
  replay.current.skippedProductCount !== 176 ||
  catalog.categories.length !== 5 ||
  catalog.subcategories.length !== 24 ||
  catalog.products.length !== 176
) {
  throw new Error("The fixture import or replay dedupe result was unexpected.");
}

console.log(
  JSON.stringify({
    categories: catalog.categories.length,
    distinctUploads: first.uploadCount,
    photoCodes: photos.length,
    productsCreated: first.current.createdProductCount,
    productsSkippedOnReplay: replay.current.skippedProductCount,
    subcategories: catalog.subcategories.length,
  }),
);
