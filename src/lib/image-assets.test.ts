import { describe, expect, test } from "bun:test";
import {
  getOptimizedProductImagePath,
  preferOptimizedProductImage,
} from "./image-assets";

describe("product image assets", () => {
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

  test("keeps the source URL when a part code does not match optimized product folders", () => {
    expect(preferOptimizedProductImage("/remote/product.jpg", "700702", 0, "card")).toBe(
      "/remote/product.jpg",
    );
  });
});
