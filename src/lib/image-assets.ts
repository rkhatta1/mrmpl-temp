export type ProductImageSize = "thumb" | "card" | "large";

const PRODUCT_PART_CODE_PATTERN = /^\d{2}-\d{3}-\d{3}$/;

function normalizePartCode(partCode: unknown) {
  return String(partCode || "").trim().toLowerCase();
}

function productImageWidth(index: number, size: ProductImageSize) {
  if (size === "thumb") return "480";
  if (size === "card") return "768";
  return index === 1 ? "880" : "1080";
}

export function getOptimizedProductImagePath(
  partCode: unknown,
  index = 0,
  size: ProductImageSize = "large",
) {
  const normalizedPartCode = normalizePartCode(partCode);
  if (!PRODUCT_PART_CODE_PATTERN.test(normalizedPartCode)) return null;

  const imageNumber = String(index + 1).padStart(2, "0");
  return `/optimized/products/${normalizedPartCode}/${imageNumber}-${productImageWidth(index, size)}.webp`;
}

export function preferOptimizedProductImage(
  fallbackUrl: unknown,
  partCode: unknown,
  index = 0,
  size: ProductImageSize = "large",
) {
  return getOptimizedProductImagePath(partCode, index, size) || String(fallbackUrl || "");
}
