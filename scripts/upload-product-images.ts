import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { UTApi, UTFile } from "uploadthing/server";

import { getUploadThingProductImageCustomId } from "../src/lib/image-assets";

type UploadedProductImage = {
  customId: string;
  key: string;
  name: string;
  size: number;
  ufsUrl: string;
  fileHash?: string;
};

type Manifest = {
  baseUrl?: string;
  uploaded: Record<string, UploadedProductImage>;
  updatedAt?: string;
};

type ProductImageFile = {
  absolutePath: string;
  relativePath: string;
  partCode: string;
  imageNumber: string;
  width: string;
  customId: string;
};

const PRODUCT_CUSTOM_ID_PREFIX = "mrmpl-product-";
const ROOT_DIR = process.cwd();
const PRODUCT_IMAGE_DIR = path.join(ROOT_DIR, "public", "optimized", "products");
const MANIFEST_PATH = path.join(ROOT_DIR, ".uploadthing", "product-images-manifest.json");
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_CONCURRENCY = 10;

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function toPosixPath(value: string) {
  return value.split(path.sep).join("/");
}

function inferBaseUrl(ufsUrl: string) {
  try {
    const url = new URL(ufsUrl);
    if (url.pathname.startsWith("/f/")) return `${url.origin}/f`;
    return undefined;
  } catch {
    return undefined;
  }
}

function getConfiguredBaseUrl() {
  return process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL?.trim().replace(/\/+$/, "");
}

function getCustomIdUfsUrl(manifest: Manifest, customId: string, fallbackUrl?: string) {
  const baseUrl = manifest.baseUrl ?? (fallbackUrl ? inferBaseUrl(fallbackUrl) : undefined);
  if (!baseUrl) return fallbackUrl ?? "";

  manifest.baseUrl = baseUrl;
  return `${baseUrl}/${customId}`;
}

function suppressUploadThingDeprecationWarnings() {
  const warn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const message = args.map(String).join(" ");
    if (message.includes("[uploadthing][deprecated]")) return;
    warn(...args);
  };
}

async function readManifest(): Promise<Manifest> {
  try {
    const raw = await readFile(MANIFEST_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<Manifest>;
    const firstUploaded = Object.values(parsed.uploaded ?? {})[0];
    return {
      baseUrl: parsed.baseUrl ?? getConfiguredBaseUrl() ?? (firstUploaded ? inferBaseUrl(firstUploaded.ufsUrl) : undefined),
      uploaded: parsed.uploaded ?? {},
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return { uploaded: {} };
  }
}

async function writeManifest(manifest: Manifest) {
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(
    MANIFEST_PATH,
    `${JSON.stringify({ ...manifest, updatedAt: new Date().toISOString() }, null, 2)}\n`,
  );
}

async function collectProductImageFiles(dir = PRODUCT_IMAGE_DIR): Promise<ProductImageFile[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) return collectProductImageFiles(absolutePath);
      if (!entry.isFile() || !entry.name.endsWith(".webp")) return [];

      const partCode = path.basename(path.dirname(absolutePath)).toLowerCase();
      const match = /^(\d{2})-(\d+)\.webp$/.exec(entry.name);
      if (!match) return [];

      const [, imageNumber, width] = match;
      const customId = getUploadThingProductImageCustomId(partCode, imageNumber, width);
      if (!customId) return [];

      return [
        {
          absolutePath,
          relativePath: toPosixPath(path.relative(PRODUCT_IMAGE_DIR, absolutePath)),
          partCode,
          imageNumber,
          width,
          customId,
        },
      ];
    }),
  );

  return files.flat().sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function assertUploadThingToken() {
  if (!process.env.UPLOADTHING_TOKEN) {
    throw new Error("Missing UPLOADTHING_TOKEN. Add it to .env.local before uploading product images.");
  }
}

async function reconcileExistingUpload(
  utapi: UTApi,
  file: ProductImageFile,
  manifest: Manifest,
): Promise<UploadedProductImage | null> {
  const existing = await utapi.getFileUrls(file.customId, { keyType: "customId" }).catch(() => null);
  const existingFile = existing?.data[0];
  if (!existingFile?.url) return null;

  const fileStats = await stat(file.absolutePath);
  const ufsUrl = getCustomIdUfsUrl(manifest, file.customId, existingFile.url);

  return {
    customId: file.customId,
    key: existingFile.key,
    name: path.basename(file.absolutePath),
    size: fileStats.size,
    ufsUrl,
  };
}

async function reconcileExistingUploadsFromUploadThing(
  utapi: UTApi,
  files: ProductImageFile[],
  manifest: Manifest,
) {
  if (!manifest.baseUrl) return 0;

  const byCustomId = new Map(files.map((file) => [file.customId, file]));
  const limit = 500;
  let offset = 0;
  let reconciled = 0;

  while (true) {
    const page = await utapi.listFiles({ limit, offset });

    for (const existing of page.files) {
      if (!existing.customId?.startsWith(PRODUCT_CUSTOM_ID_PREFIX)) continue;
      if (existing.status !== "Uploaded") continue;

      const file = byCustomId.get(existing.customId);
      if (!file || manifest.uploaded[file.relativePath]) continue;

      manifest.uploaded[file.relativePath] = {
        customId: existing.customId,
        key: existing.key,
        name: existing.name,
        size: existing.size,
        ufsUrl: `${manifest.baseUrl}/${existing.customId}`,
      };
      reconciled += 1;
    }

    if (!page.hasMore) break;
    offset += limit;
  }

  if (reconciled > 0) await writeManifest(manifest);
  return reconciled;
}

async function main() {
  suppressUploadThingDeprecationWarnings();
  assertUploadThingToken();

  const dryRun = process.argv.includes("--dry-run");
  const batchSize = parsePositiveInteger(process.env.UPLOADTHING_UPLOAD_BATCH_SIZE, DEFAULT_BATCH_SIZE);
  const concurrency = Math.min(
    parsePositiveInteger(process.env.UPLOADTHING_UPLOAD_CONCURRENCY, DEFAULT_CONCURRENCY),
    25,
  );

  const files = await collectProductImageFiles();
  const manifest = await readManifest();
  const utapi = new UTApi({
    token: process.env.UPLOADTHING_TOKEN,
    logLevel: "Fatal",
  });
  const reconciled = await reconcileExistingUploadsFromUploadThing(utapi, files, manifest);
  const pending = files.filter((file) => !manifest.uploaded[file.relativePath]);

  console.log(`Product image files found: ${files.length}`);
  if (reconciled > 0) console.log(`Reconciled existing UploadThing files: ${reconciled}`);
  console.log(`Already uploaded in manifest: ${files.length - pending.length}`);
  console.log(`Pending upload: ${pending.length}`);

  if (pending.length > 0) {
    console.log(`First pending customId: ${pending[0].customId}`);
  }

  if (dryRun || pending.length === 0) {
    if (manifest.baseUrl) {
      console.log(`NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL=${manifest.baseUrl}`);
    }
    return;
  }

  let uploadedCount = files.length - pending.length;

  for (const batch of chunk(pending, batchSize)) {
    const uploadFiles = batch.map((file) => {
      const blob = Bun.file(file.absolutePath);
      return new UTFile([blob], path.basename(file.absolutePath), {
        customId: file.customId,
        type: "image/webp",
      });
    });

    const results = await utapi.uploadFiles(uploadFiles, {
      acl: "public-read",
      concurrency,
    });

    for (const [index, result] of results.entries()) {
      const file = batch[index];
      if (!result.data) {
        const reconciled = await reconcileExistingUpload(utapi, file, manifest);
        if (reconciled) {
          manifest.uploaded[file.relativePath] = reconciled;
          uploadedCount += 1;
          continue;
        }

        throw new Error(`Upload failed for ${file.relativePath}: ${result.error?.message ?? "unknown error"}`);
      }

      const uploaded = result.data;
      const ufsUrl = getCustomIdUfsUrl(manifest, file.customId, uploaded.ufsUrl);

      manifest.uploaded[file.relativePath] = {
        customId: file.customId,
        key: uploaded.key,
        name: uploaded.name,
        size: uploaded.size,
        ufsUrl,
        fileHash: uploaded.fileHash,
      };

      uploadedCount += 1;
    }

    await writeManifest(manifest);
    console.log(`Uploaded ${uploadedCount}/${files.length}`);
  }

  if (!manifest.baseUrl) {
    const firstUploaded = Object.values(manifest.uploaded)[0];
    if (firstUploaded) manifest.baseUrl = inferBaseUrl(firstUploaded.ufsUrl);
    await writeManifest(manifest);
  }

  console.log("Product image upload complete.");
  if (manifest.baseUrl) {
    console.log(`NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL=${manifest.baseUrl}`);
  }
  const usage = await utapi.getUsageInfo();
  console.log(`UploadThing app storage used: ${usage.appTotalBytes}/${usage.limitBytes} bytes`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
