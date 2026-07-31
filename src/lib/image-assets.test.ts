import { describe, expect, test } from "bun:test";
import {
  getOptimizedProductImagePath,
  getProductImageFallbackSrc,
  getUploadThingProductImageCustomId,
  preferOptimizedProductImage,
} from "./image-assets";

describe("product image assets", () => {
  test("prefers admin-uploaded UploadThing images over generated legacy paths", () => {
    const uploaded = "https://abc123.ufs.sh/f/product-image";

    expect(preferOptimizedProductImage(uploaded, "12-345-678", 0, "large")).toBe(
      uploaded,
    );
    expect(getProductImageFallbackSrc(uploaded, "12-345-678", 0, "large")).toBe(
      "/optimized/products/12-345-678/01-1080.webp",
    );
  });

  test("selects the requested responsive variant for an admin-uploaded asset", () => {
    const uploaded =
      "https://abc123.ufs.sh/f/mrmpl-product-11-375-002-abc123def456-1080-webp";

    expect(preferOptimizedProductImage(uploaded, "11-375-002", 0, "thumb")).toBe(
      "https://abc123.ufs.sh/f/mrmpl-product-11-375-002-abc123def456-480-webp",
    );
    expect(preferOptimizedProductImage(uploaded, "11-375-002", 0, "card")).toBe(
      "https://abc123.ufs.sh/f/mrmpl-product-11-375-002-abc123def456-768-webp",
    );
    expect(preferOptimizedProductImage(uploaded, "11-375-002", 1, "large")).toBe(
      "https://abc123.ufs.sh/f/mrmpl-product-11-375-002-abc123def456-880-webp",
    );
  });

  test("resolves optimized product photo paths from copied product asset folders", () => {
    expect(getOptimizedProductImagePath("06-279-001", 0, "large")).toBe(
      "/optimized/products/06-279-001/01-1080.webp",
    );
  });

  test("resolves optimized technical drawing paths at the copied drawing size", () => {
    expect(getOptimizedProductImagePath("06-279-001", 1, "large")).toBe(
      "/optimized/products/06-279-001/02-880.webp",
    );
  });

  test("resolves UploadThing CDN paths when a product image base URL is configured", () => {
    const originalBaseUrl = process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL;
    process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL = "https://example.ufs.sh/f/";

    try {
      expect(getOptimizedProductImagePath("06-279-001", 0, "card")).toBe(
        "https://example.ufs.sh/f/mrmpl-product-06-279-001-01-768-webp",
      );
    } finally {
      process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL = originalBaseUrl;
    }
  });

  test("preserves a stored legacy image's identity when its display order changes", () => {
    const originalBaseUrl = process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL;
    process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL = "https://example.ufs.sh/f/";

    try {
      expect(
        preferOptimizedProductImage(
          "/optimized/products/11-375-002/02-880.webp",
          "11-375-002",
          0,
          "large",
        ),
      ).toBe(
        "https://example.ufs.sh/f/mrmpl-product-11-375-002-02-880-webp",
      );
    } finally {
      process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL = originalBaseUrl;
    }
  });

  test("keeps the matching stored legacy path as the CDN image fallback", () => {
    const originalBaseUrl = process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL;
    process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL = "https://example.ufs.sh/f/";
    const stored = "/optimized/products/11-375-002/02-880.webp";

    try {
      expect(getProductImageFallbackSrc(stored, "11-375-002", 0, "large")).toBe(
        stored,
      );
    } finally {
      process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL = originalBaseUrl;
    }
  });

  test("keeps priority product images local and uses UploadThing as fallback", () => {
    const originalBaseUrl = process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL;
    process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL = "https://example.ufs.sh/f/";

    try {
      expect(getOptimizedProductImagePath("01-001-001", 0, "card")).toBe(
        "/optimized/priority-products/01-001-001/01-768.webp",
      );
      expect(getProductImageFallbackSrc("/remote/product.jpg", "01-001-001", 0, "card")).toBe(
        "https://example.ufs.sh/f/mrmpl-product-01-001-001-01-768-webp",
      );
    } finally {
      process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASE_URL = originalBaseUrl;
    }
  });

  test("generates URL-safe UploadThing custom IDs for product images", () => {
    expect(getUploadThingProductImageCustomId("06-279-001", "01", "1080")).toBe(
      "mrmpl-product-06-279-001-01-1080-webp",
    );
  });

  test("keeps the source URL when a part code does not match optimized product folders", () => {
    expect(preferOptimizedProductImage("/remote/product.jpg", "700702", 0, "card")).toBe(
      "/remote/product.jpg",
    );
  });
});
