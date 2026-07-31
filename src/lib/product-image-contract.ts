export const PRODUCT_IMAGE_VARIANT_WIDTHS = [480, 768, 880, 1080] as const;
export const MAX_PRODUCT_IMAGE_VARIANT_BYTES = 50 * 1024;

export type ProductImageVariantWidth =
  (typeof PRODUCT_IMAGE_VARIANT_WIDTHS)[number];

export type ProductImageVariantDescriptor = {
  customId: string;
  fileName: string;
  height: number;
  targetWidth: ProductImageVariantWidth;
  width: number;
};

export type ProductImageVariantIdentity = {
  customId: string;
  mediaId: string;
  partCode: string;
  width: ProductImageVariantWidth;
};

const PRODUCT_PART_CODE_PATTERN = /^\d{2}-\d{3}-\d{3}$/;
const PRODUCT_MEDIA_ID_PATTERN = /^[a-z0-9]{2,32}$/;
const PRODUCT_IMAGE_CUSTOM_ID_PATTERN =
  /^mrmpl-product-(\d{2}-\d{3}-\d{3})-([a-z0-9]{2,32})-(480|768|880|1080)-webp$/;

function normalizePartCode(partCode: unknown) {
  return String(partCode || "").trim().toLowerCase();
}

function isProductImageVariantWidth(
  value: number,
): value is ProductImageVariantWidth {
  return PRODUCT_IMAGE_VARIANT_WIDTHS.includes(
    value as ProductImageVariantWidth,
  );
}

export function getUploadThingProductImageCustomId(
  partCode: unknown,
  mediaId: string,
  width: string | number,
) {
  const normalizedPartCode = normalizePartCode(partCode);
  const normalizedMediaId = String(mediaId || "").trim().toLowerCase();
  const normalizedWidth = String(width || "").trim();

  if (!PRODUCT_PART_CODE_PATTERN.test(normalizedPartCode)) return null;
  if (!PRODUCT_MEDIA_ID_PATTERN.test(normalizedMediaId)) return null;
  if (!/^\d+$/.test(normalizedWidth)) return null;

  return `mrmpl-product-${normalizedPartCode}-${normalizedMediaId}-${normalizedWidth}-webp`;
}

export function parseProductImageVariantCustomId(
  value: unknown,
): ProductImageVariantIdentity | null {
  const customId = String(value || "").trim().toLowerCase();
  const match = PRODUCT_IMAGE_CUSTOM_ID_PATTERN.exec(customId);
  if (!match) return null;

  const [, partCode, mediaId, rawWidth] = match;
  const width = Number(rawWidth);
  if (!isProductImageVariantWidth(width)) return null;

  return { customId, mediaId, partCode, width };
}

export function parseProductImageVariantFilename(
  value: unknown,
): ProductImageVariantIdentity | null {
  const fileName = String(value || "").trim().toLowerCase();
  if (!fileName.endsWith(".webp")) return null;
  return parseProductImageVariantCustomId(fileName.slice(0, -5));
}

export function getProductImageVariantUrl(
  uploadUrl: unknown,
  customId: unknown,
) {
  const identity = parseProductImageVariantCustomId(customId);
  if (!identity) return null;

  try {
    const parsedUrl = new URL(String(uploadUrl || ""));
    if (
      parsedUrl.protocol !== "https:" ||
      (parsedUrl.hostname !== "utfs.io" &&
        !parsedUrl.hostname.endsWith(".ufs.sh"))
    ) {
      return null;
    }

    const pathSegments = parsedUrl.pathname.split("/");
    pathSegments[pathSegments.length - 1] = identity.customId;
    parsedUrl.pathname = pathSegments.join("/");
    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export function validateProductImageVariantFilenames(
  fileNames: readonly string[],
) {
  if (fileNames.length !== PRODUCT_IMAGE_VARIANT_WIDTHS.length) return null;

  const variants = fileNames.map(parseProductImageVariantFilename);
  if (variants.some((variant) => variant === null)) return null;

  const parsed = variants as ProductImageVariantIdentity[];
  const [{ partCode, mediaId }] = parsed;
  const widths = new Set(parsed.map((variant) => variant.width));
  if (
    parsed.some(
      (variant) =>
        variant.partCode !== partCode || variant.mediaId !== mediaId,
    ) ||
    widths.size !== PRODUCT_IMAGE_VARIANT_WIDTHS.length ||
    PRODUCT_IMAGE_VARIANT_WIDTHS.some((width) => !widths.has(width))
  ) {
    return null;
  }

  return parsed.map((variant) => variant.customId);
}

export function getProductImageVariantDescriptors({
  height,
  mediaId,
  partCode,
  width,
}: {
  height: number;
  mediaId: string;
  partCode: unknown;
  width: number;
}): ProductImageVariantDescriptor[] {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error("Could not read the image dimensions.");
  }

  return PRODUCT_IMAGE_VARIANT_WIDTHS.map((targetWidth) => {
    const customId = getUploadThingProductImageCustomId(
      partCode,
      mediaId,
      targetWidth,
    );
    if (!customId) {
      throw new Error("The product image identifier is invalid.");
    }

    const outputWidth = Math.min(Math.round(width), targetWidth);
    const outputHeight = Math.max(1, Math.round((height / width) * outputWidth));

    return {
      customId,
      fileName: `${customId}.webp`,
      height: outputHeight,
      targetWidth,
      width: outputWidth,
    };
  });
}

export function createProductImageMediaId() {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (!randomUuid) {
    throw new Error("The browser could not create an image identifier.");
  }
  return randomUuid.replaceAll("-", "").slice(0, 12);
}

export function moveProductImageToPosition<T>(
  images: readonly T[],
  fromIndex: number,
  toIndex: number,
) {
  const next = [...images];
  if (
    fromIndex < 0 ||
    fromIndex >= next.length ||
    toIndex < 0 ||
    toIndex >= next.length ||
    fromIndex === toIndex
  ) {
    return next;
  }

  const [selected] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, selected);
  return next;
}
