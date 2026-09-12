export const BULK_PRODUCT_PHOTO_VARIANT_WIDTHS = [480, 768, 880, 1080] as const;
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

export type BulkProductPhotoUploadBatchIdentity = {
  contentHashes: string[];
  customIds: string[];
  jobExternalId: string;
};

type BulkProductPhotoVariantIdentity = {
  contentHash: string;
  customId: string;
  jobExternalId: string | null;
  width: BulkProductPhotoVariantWidth;
};

const CONTENT_HASH_PATTERN = /^[a-f0-9]{64}$/;
const JOB_EXTERNAL_ID_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const SCOPED_CUSTOM_ID_PATTERN =
  /^mrmpl-bulk-([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})-([a-f0-9]{64})-(480|768|880|1080)-webp$/;
const LEGACY_CUSTOM_ID_PATTERN =
  /^mrmpl-bulk-product-photo-([a-f0-9]{64})-(480|768|880|1080)-webp$/;

function isVariantWidth(value: number): value is BulkProductPhotoVariantWidth {
  return BULK_PRODUCT_PHOTO_VARIANT_WIDTHS.includes(
    value as BulkProductPhotoVariantWidth,
  );
}

export function normalizeBulkProductPhotoContentHash(value: unknown) {
  const normalized = String(value ?? "")
    .trim()
    .toLocaleLowerCase();
  return CONTENT_HASH_PATTERN.test(normalized) ? normalized : null;
}

export function getBulkProductPhotoCustomId(
  jobExternalId: unknown,
  contentHash: unknown,
  width: string | number,
) {
  const normalizedJobExternalId = String(jobExternalId ?? "")
    .trim()
    .toLocaleLowerCase();
  const normalizedHash = normalizeBulkProductPhotoContentHash(contentHash);
  const numericWidth = Number(width);
  if (
    !JOB_EXTERNAL_ID_PATTERN.test(normalizedJobExternalId) ||
    !normalizedHash ||
    !isVariantWidth(numericWidth)
  ) {
    return null;
  }
  // UploadThing rejected the previous 136-character prefix form during a live upload.
  return `mrmpl-bulk-${normalizedJobExternalId}-${normalizedHash}-${numericWidth}-webp`;
}

export function parseBulkProductPhotoVariantFilename(
  value: unknown,
): BulkProductPhotoVariantIdentity | null {
  const fileName = String(value ?? "")
    .trim()
    .toLocaleLowerCase();
  if (!fileName.endsWith(".webp")) return null;
  return parseBulkProductPhotoCustomId(fileName.slice(0, -5));
}

export function parseBulkProductPhotoCustomId(
  value: unknown,
): BulkProductPhotoVariantIdentity | null {
  const customId = String(value ?? "")
    .trim()
    .toLocaleLowerCase();
  const scopedMatch = SCOPED_CUSTOM_ID_PATTERN.exec(customId);
  const legacyMatch = scopedMatch
    ? null
    : LEGACY_CUSTOM_ID_PATTERN.exec(customId);
  const width = Number(scopedMatch?.[3] ?? legacyMatch?.[2]);
  if (!isVariantWidth(width)) return null;
  if (scopedMatch) {
    return {
      contentHash: scopedMatch[2],
      customId,
      jobExternalId: scopedMatch[1],
      width,
    };
  }
  if (!legacyMatch) return null;
  return {
    contentHash: legacyMatch[1],
    customId,
    jobExternalId: null,
    width,
  };
}

export function getBulkProductPhotoSiblingCustomId(
  customId: unknown,
  width: string | number,
) {
  const identity = parseBulkProductPhotoCustomId(customId);
  const numericWidth = Number(width);
  if (!identity || !isVariantWidth(numericWidth)) return null;
  return identity.jobExternalId
    ? getBulkProductPhotoCustomId(
        identity.jobExternalId,
        identity.contentHash,
        numericWidth,
      )
    : `mrmpl-bulk-product-photo-${identity.contentHash}-${numericWidth}-webp`;
}

export function validateBulkProductPhotoVariantFilenames(
  fileNames: readonly string[],
) {
  return parseBulkProductPhotoUploadBatch(fileNames)?.customIds ?? null;
}

export function parseBulkProductPhotoUploadBatch(
  fileNames: readonly string[],
): BulkProductPhotoUploadBatchIdentity | null {
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
  if (
    identities.some((identity) => !identity.jobExternalId) ||
    new Set(identities.map((identity) => identity.jobExternalId)).size !== 1
  ) {
    return null;
  }
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

  return {
    contentHashes: [...hashes.keys()],
    customIds: identities.map((identity) => identity.customId),
    jobExternalId: identities[0].jobExternalId!,
  };
}

export function getBulkProductPhotoVariantUrl(
  uploadUrl: unknown,
  customId: unknown,
) {
  const identity = parseBulkProductPhotoCustomId(customId);
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
    path[path.length - 1] = identity.customId;
    parsedUrl.pathname = path.join("/");
    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export function getBulkProductPhotoVariantDescriptors({
  contentHash,
  height,
  jobExternalId,
  width,
}: {
  contentHash: unknown;
  height: number;
  jobExternalId: unknown;
  width: number;
}): BulkProductPhotoVariantDescriptor[] {
  const normalizedHash = normalizeBulkProductPhotoContentHash(contentHash);
  if (!normalizedHash)
    throw new Error("The product photo content hash is invalid.");
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error("Could not read the product photo dimensions.");
  }

  return BULK_PRODUCT_PHOTO_VARIANT_WIDTHS.map((targetWidth) => {
    const customId = getBulkProductPhotoCustomId(
      jobExternalId,
      normalizedHash,
      targetWidth,
    );
    if (!customId)
      throw new Error("Could not build the product photo identifier.");
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
