import priorityProductPartCodes from "../data/priority-product-part-codes.json";
import {
  getUploadThingProductImageCustomId,
  parseProductImageVariantCustomId,
} from "./product-image-contract";

export { getUploadThingProductImageCustomId } from "./product-image-contract";

export type ProductImageSize = "thumb" | "card" | "large";

const PRODUCT_PART_CODE_PATTERN = /^\d{2}-\d{3}-\d{3}$/;
const PRODUCT_IMAGE_BASE_URL_ENV = "NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL";
const LOCAL_PRODUCT_IMAGE_BASE_PATH = "/optimized/products";
const PRIORITY_PRODUCT_IMAGE_BASE_PATH = "/optimized/priority-products";
const STORED_PRODUCT_IMAGE_PATTERN =
  /^\/optimized\/products\/(\d{2}-\d{3}-\d{3})\/(\d{2})-(\d+)\.webp$/i;
const PRIORITY_PRODUCT_PART_CODES = new Set(priorityProductPartCodes);

function normalizePartCode(partCode: unknown) {
  return String(partCode || "").trim().toLowerCase();
}

function productImageWidth(index: number, size: ProductImageSize) {
  if (size === "thumb") return "480";
  if (size === "card") return "768";
  return index === 1 ? "880" : "1080";
}

function getProductImageBaseUrl() {
  const value = process.env[PRODUCT_IMAGE_BASE_URL_ENV]?.trim();
  if (!value) return null;
  return value.replace(/\/+$/, "");
}

function isUploadThingImageUrl(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "utfs.io" || parsed.hostname.endsWith(".ufs.sh"))
    );
  } catch {
    return false;
  }
}

function getUploadedProductImageVariantUrl(
  value: string,
  index: number,
  size: ProductImageSize,
) {
  if (!isUploadThingImageUrl(value)) return null;

  const parsedUrl = new URL(value);
  const pathSegments = parsedUrl.pathname.split("/");
  const currentCustomId = pathSegments.at(-1);
  const identity = parseProductImageVariantCustomId(currentCustomId);
  if (!identity) return null;

  const customId = getUploadThingProductImageCustomId(
    identity.partCode,
    identity.mediaId,
    productImageWidth(index, size),
  );
  if (!customId) return null;

  pathSegments[pathSegments.length - 1] = customId;
  parsedUrl.pathname = pathSegments.join("/");
  return parsedUrl.toString();
}

function getStoredProductImageUploadThingPath(value: string) {
  const match = STORED_PRODUCT_IMAGE_PATTERN.exec(value);
  const remoteBaseUrl = getProductImageBaseUrl();
  if (!match || !remoteBaseUrl) return null;

  const [, partCode, imageNumber, width] = match;
  const customId = getUploadThingProductImageCustomId(
    partCode,
    imageNumber,
    width,
  );
  return customId ? `${remoteBaseUrl}/${customId}` : null;
}

function getProductImageDetails(
  partCode: unknown,
  index = 0,
  size: ProductImageSize = "large",
) {
  const normalizedPartCode = normalizePartCode(partCode);
  if (!PRODUCT_PART_CODE_PATTERN.test(normalizedPartCode)) return null;

  const imageNumber = String(index + 1).padStart(2, "0");
  const width = productImageWidth(index, size);
  const customId = getUploadThingProductImageCustomId(normalizedPartCode, imageNumber, width);
  if (!customId) return null;

  return {
    normalizedPartCode,
    imageNumber,
    width,
    customId,
  };
}

function getLocalProductImagePath(partCode: string, imageNumber: string, width: string) {
  const basePath = PRIORITY_PRODUCT_PART_CODES.has(partCode)
    ? PRIORITY_PRODUCT_IMAGE_BASE_PATH
    : LOCAL_PRODUCT_IMAGE_BASE_PATH;

  return `${basePath}/${partCode}/${imageNumber}-${width}.webp`;
}

export function getUploadThingProductImagePath(
  partCode: unknown,
  index = 0,
  size: ProductImageSize = "large",
) {
  const details = getProductImageDetails(partCode, index, size);
  const remoteBaseUrl = getProductImageBaseUrl();
  if (!details || !remoteBaseUrl) return null;

  return `${remoteBaseUrl}/${details.customId}`;
}

export function getOptimizedProductImagePath(
  partCode: unknown,
  index = 0,
  size: ProductImageSize = "large",
) {
  const details = getProductImageDetails(partCode, index, size);
  if (!details) return null;

  if (!PRIORITY_PRODUCT_PART_CODES.has(details.normalizedPartCode)) {
    const remotePath = getUploadThingProductImagePath(details.normalizedPartCode, index, size);
    if (remotePath) return remotePath;
  }

  return getLocalProductImagePath(details.normalizedPartCode, details.imageNumber, details.width);
}

export function getProductImageFallbackSrc(
  fallbackUrl: unknown,
  partCode: unknown,
  index = 0,
  size: ProductImageSize = "large",
) {
  const explicitSrc = String(fallbackUrl || "");
  const uploadedVariantSrc = getUploadedProductImageVariantUrl(
    explicitSrc,
    index,
    size,
  );
  if (uploadedVariantSrc) {
    return uploadedVariantSrc === explicitSrc ? undefined : explicitSrc;
  }
  const storedImageSrc = getStoredProductImageUploadThingPath(explicitSrc);
  const primarySrc =
    storedImageSrc || getOptimizedProductImagePath(partCode, index, size);
  if (isUploadThingImageUrl(explicitSrc)) {
    return primarySrc && primarySrc !== explicitSrc ? primarySrc : undefined;
  }
  if (storedImageSrc) return explicitSrc || undefined;
  const remoteSrc = getUploadThingProductImagePath(partCode, index, size);
  const fallbackSrc = remoteSrc || explicitSrc;

  if (!fallbackSrc || fallbackSrc === primarySrc) return undefined;
  return fallbackSrc;
}

export function getProductImageSources(
  fallbackUrl: unknown,
  partCode: unknown,
  index = 0,
  size: ProductImageSize = "large",
) {
  return {
    src: preferOptimizedProductImage(fallbackUrl, partCode, index, size),
    fallbackSrc: getProductImageFallbackSrc(fallbackUrl, partCode, index, size),
  };
}

export function preferOptimizedProductImage(
  fallbackUrl: unknown,
  partCode: unknown,
  index = 0,
  size: ProductImageSize = "large",
) {
  const explicitSrc = String(fallbackUrl || "");
  const uploadedVariantSrc = getUploadedProductImageVariantUrl(
    explicitSrc,
    index,
    size,
  );
  if (uploadedVariantSrc) return uploadedVariantSrc;
  if (isUploadThingImageUrl(explicitSrc)) return explicitSrc;
  const storedImageSrc = getStoredProductImageUploadThingPath(explicitSrc);
  if (storedImageSrc) return storedImageSrc;
  return getOptimizedProductImagePath(partCode, index, size) || explicitSrc;
}
