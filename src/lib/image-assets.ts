import priorityProductPartCodes from "../data/priority-product-part-codes.json";

export type ProductImageSize = "thumb" | "card" | "large";

const PRODUCT_PART_CODE_PATTERN = /^\d{2}-\d{3}-\d{3}$/;
const PRODUCT_IMAGE_BASE_URL_ENV = "NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL";
const LOCAL_PRODUCT_IMAGE_BASE_PATH = "/optimized/products";
const PRIORITY_PRODUCT_IMAGE_BASE_PATH = "/optimized/priority-products";
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

export function getUploadThingProductImageCustomId(
  partCode: unknown,
  imageNumber: string,
  width: string,
) {
  const normalizedPartCode = normalizePartCode(partCode);
  if (!PRODUCT_PART_CODE_PATTERN.test(normalizedPartCode)) return null;
  if (!/^\d{2}$/.test(imageNumber) || !/^\d+$/.test(width)) return null;

  return `mrmpl-product-${normalizedPartCode}-${imageNumber}-${width}-webp`;
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
  const primarySrc = getOptimizedProductImagePath(partCode, index, size);
  const remoteSrc = getUploadThingProductImagePath(partCode, index, size);
  const fallbackSrc = remoteSrc || String(fallbackUrl || "");

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
  return getOptimizedProductImagePath(partCode, index, size) || String(fallbackUrl || "");
}
