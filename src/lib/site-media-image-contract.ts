import {
  PRODUCT_IMAGE_VARIANT_WIDTHS,
  type ProductImageVariantWidth,
} from "./product-image-contract";

export const SITE_MEDIA_IMAGE_VARIANT_WIDTHS = PRODUCT_IMAGE_VARIANT_WIDTHS;
export const MAX_SITE_MEDIA_IMAGE_VARIANT_BYTES = 800 * 1024;

export type SiteMediaImageVariantDescriptor = {
  customId: string;
  fileName: string;
  height: number;
  targetWidth: ProductImageVariantWidth;
  width: number;
};

export type SiteMediaImageVariantIdentity = {
  customId: string;
  mediaId: string;
  width: ProductImageVariantWidth;
};

const SITE_MEDIA_ID_PATTERN = /^[a-z0-9]{2,32}$/;
const SITE_MEDIA_IMAGE_CUSTOM_ID_PATTERN =
  /^mrmpl-site-([a-z0-9]{2,32})-(480|768|880|1080)-webp$/;

function isSiteMediaImageVariantWidth(
  value: number,
): value is ProductImageVariantWidth {
  return SITE_MEDIA_IMAGE_VARIANT_WIDTHS.includes(
    value as ProductImageVariantWidth,
  );
}

export function getUploadThingSiteMediaImageCustomId(
  mediaId: string,
  width: string | number,
) {
  const normalizedMediaId = String(mediaId || "")
    .trim()
    .toLowerCase();
  const normalizedWidth = String(width || "").trim();

  if (!SITE_MEDIA_ID_PATTERN.test(normalizedMediaId)) return null;
  if (!/^\d+$/.test(normalizedWidth)) return null;

  return `mrmpl-site-${normalizedMediaId}-${normalizedWidth}-webp`;
}

export function parseSiteMediaImageVariantCustomId(
  value: unknown,
): SiteMediaImageVariantIdentity | null {
  const customId = String(value || "")
    .trim()
    .toLowerCase();
  const match = SITE_MEDIA_IMAGE_CUSTOM_ID_PATTERN.exec(customId);
  if (!match) return null;

  const [, mediaId, rawWidth] = match;
  const width = Number(rawWidth);
  if (!isSiteMediaImageVariantWidth(width)) return null;

  return { customId, mediaId, width };
}

export function parseSiteMediaImageVariantFilename(
  value: unknown,
): SiteMediaImageVariantIdentity | null {
  const fileName = String(value || "")
    .trim()
    .toLowerCase();
  if (!fileName.endsWith(".webp")) return null;
  return parseSiteMediaImageVariantCustomId(fileName.slice(0, -5));
}

export function getSiteMediaImageVariantUrl(
  uploadUrl: unknown,
  customId: unknown,
) {
  const identity = parseSiteMediaImageVariantCustomId(customId);
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

export function validateSiteMediaImageVariantFilenames(
  fileNames: readonly string[],
) {
  if (fileNames.length !== SITE_MEDIA_IMAGE_VARIANT_WIDTHS.length) return null;

  const variants = fileNames.map(parseSiteMediaImageVariantFilename);
  if (variants.some((variant) => variant === null)) return null;

  const parsed = variants as SiteMediaImageVariantIdentity[];
  const [{ mediaId }] = parsed;
  const widths = new Set(parsed.map((variant) => variant.width));
  if (
    parsed.some((variant) => variant.mediaId !== mediaId) ||
    widths.size !== SITE_MEDIA_IMAGE_VARIANT_WIDTHS.length ||
    SITE_MEDIA_IMAGE_VARIANT_WIDTHS.some((width) => !widths.has(width))
  ) {
    return null;
  }

  return parsed.map((variant) => variant.customId);
}

export function getSiteMediaImageVariantDescriptors({
  height,
  mediaId,
  width,
}: {
  height: number;
  mediaId: string;
  width: number;
}): SiteMediaImageVariantDescriptor[] {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error("Could not read the image dimensions.");
  }

  return SITE_MEDIA_IMAGE_VARIANT_WIDTHS.map((targetWidth) => {
    const customId = getUploadThingSiteMediaImageCustomId(mediaId, targetWidth);
    if (!customId) {
      throw new Error("The site media image identifier is invalid.");
    }

    const outputWidth = Math.min(Math.round(width), targetWidth);
    const outputHeight = Math.max(
      1,
      Math.round((height / width) * outputWidth),
    );

    return {
      customId,
      fileName: `${customId}.webp`,
      height: outputHeight,
      targetWidth,
      width: outputWidth,
    };
  });
}

export function createSiteMediaImageMediaId() {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (!randomUuid) {
    throw new Error("The browser could not create an image identifier.");
  }
  return randomUuid.replaceAll("-", "").slice(0, 12);
}
