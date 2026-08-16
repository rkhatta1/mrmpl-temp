export const BULK_PRODUCT_PHOTO_VARIANT_WIDTHS = [
  480, 768, 880, 1080,
] as const;
export const MAX_BULK_PRODUCT_PHOTO_VARIANT_BYTES = 50 * 1024;
export const MAX_BULK_PRODUCT_PHOTOS_PER_UPLOAD = 10;

export type BulkProductPhotoVariantWidth =
  (typeof BULK_PRODUCT_PHOTO_VARIANT_WIDTHS)[number];

export type BulkProductPhotoVariantDescriptor = {
  contentHash: string;
  customId: string;
  fileName: string;
  height: number;
  targetWidth: BulkProductPhotoVariantWidth;
  width: number;
};

type BulkProductPhotoVariantIdentity = {
  contentHash: string;
  customId: string;
  width: BulkProductPhotoVariantWidth;
};

const CONTENT_HASH_PATTERN = /^[a-f0-9]{64}$/;
const CUSTOM_ID_PATTERN =
  /^mrmpl-bulk-product-photo-([a-f0-9]{64})-(480|768|880|1080)-webp$/;

function isVariantWidth(value: number): value is BulkProductPhotoVariantWidth {
  return BULK_PRODUCT_PHOTO_VARIANT_WIDTHS.includes(
    value as BulkProductPhotoVariantWidth,
  );
}

export function normalizeBulkProductPhotoContentHash(value: unknown) {
  const normalized = String(value ?? "").trim().toLocaleLowerCase();
  return CONTENT_HASH_PATTERN.test(normalized) ? normalized : null;
}

export function getBulkProductPhotoCustomId(
  contentHash: unknown,
  width: string | number,
) {
  const normalizedHash = normalizeBulkProductPhotoContentHash(contentHash);
  const numericWidth = Number(width);
  if (!normalizedHash || !isVariantWidth(numericWidth)) return null;
  return `mrmpl-bulk-product-photo-${normalizedHash}-${numericWidth}-webp`;
}

export function parseBulkProductPhotoVariantFilename(
  value: unknown,
): BulkProductPhotoVariantIdentity | null {
  const fileName = String(value ?? "").trim().toLocaleLowerCase();
  if (!fileName.endsWith(".webp")) return null;
  const customId = fileName.slice(0, -5);
  const match = CUSTOM_ID_PATTERN.exec(customId);
  if (!match) return null;
  const width = Number(match[2]);
  if (!isVariantWidth(width)) return null;
  return { contentHash: match[1], customId, width };
}

export function validateBulkProductPhotoVariantFilenames(
  fileNames: readonly string[],
) {
  if (
    fileNames.length === 0 ||
    fileNames.length % BULK_PRODUCT_PHOTO_VARIANT_WIDTHS.length !== 0 ||
    fileNames.length >
      MAX_BULK_PRODUCT_PHOTOS_PER_UPLOAD *
        BULK_PRODUCT_PHOTO_VARIANT_WIDTHS.length
  ) {
    return null;
  }

  const parsed = fileNames.map(parseBulkProductPhotoVariantFilename);
  if (parsed.some((variant) => variant === null)) return null;

  const identities = parsed as BulkProductPhotoVariantIdentity[];
  const hashes = new Map<string, Set<BulkProductPhotoVariantWidth>>();
  for (const identity of identities) {
    const widths = hashes.get(identity.contentHash) ?? new Set();
    if (widths.has(identity.width)) return null;
    widths.add(identity.width);
    hashes.set(identity.contentHash, widths);
  }

  if (
    [...hashes.values()].some(
      (widths) =>
        widths.size !== BULK_PRODUCT_PHOTO_VARIANT_WIDTHS.length ||
        BULK_PRODUCT_PHOTO_VARIANT_WIDTHS.some((width) => !widths.has(width)),
    )
  ) {
    return null;
  }

  return identities.map((identity) => identity.customId);
}

export function getBulkProductPhotoVariantUrl(
  uploadUrl: unknown,
  customId: unknown,
) {
  const identity = CUSTOM_ID_PATTERN.exec(
    String(customId ?? "").trim().toLocaleLowerCase(),
  );
  if (!identity) return null;

  try {
    const parsedUrl = new URL(String(uploadUrl ?? ""));
    if (
      parsedUrl.protocol !== "https:" ||
      (parsedUrl.hostname !== "utfs.io" &&
        !parsedUrl.hostname.endsWith(".ufs.sh"))
    ) {
      return null;
    }
    const path = parsedUrl.pathname.split("/");
    path[path.length - 1] = identity[0];
    parsedUrl.pathname = path.join("/");
    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export function getBulkProductPhotoVariantDescriptors({
  contentHash,
  height,
  width,
}: {
  contentHash: unknown;
  height: number;
  width: number;
}): BulkProductPhotoVariantDescriptor[] {
  const normalizedHash = normalizeBulkProductPhotoContentHash(contentHash);
  if (!normalizedHash) throw new Error("The product photo content hash is invalid.");
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error("Could not read the product photo dimensions.");
  }

  return BULK_PRODUCT_PHOTO_VARIANT_WIDTHS.map((targetWidth) => {
    const customId = getBulkProductPhotoCustomId(normalizedHash, targetWidth);
    if (!customId) throw new Error("Could not build the product photo identifier.");
    const outputWidth = Math.min(Math.round(width), targetWidth);
    return {
      contentHash: normalizedHash,
      customId,
      fileName: `${customId}.webp`,
      height: Math.max(1, Math.round((height / width) * outputWidth)),
      targetWidth,
      width: outputWidth,
    };
  });
}

export async function hashBulkProductPhotoFile(file: Blob) {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
