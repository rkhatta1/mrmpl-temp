import { describe, expect, test } from "bun:test";

import {
  MAX_PRODUCT_IMAGE_VARIANT_BYTES,
  getProductImageVariantUrl,
  getProductImageVariantDescriptors,
  moveProductImageToPosition,
  validateProductImageVariantFilenames,
} from "./product-image-contract";

describe("product image variants", () => {
  test("plans the complete responsive set with stable custom IDs", () => {
    expect(
      getProductImageVariantDescriptors({
        height: 900,
        mediaId: "abc123def456",
        partCode: "11-375-002",
        width: 1600,
      }),
    ).toEqual([
      {
        customId: "mrmpl-product-11-375-002-abc123def456-480-webp",
        fileName: "mrmpl-product-11-375-002-abc123def456-480-webp.webp",
        height: 270,
        targetWidth: 480,
        width: 480,
      },
      {
        customId: "mrmpl-product-11-375-002-abc123def456-768-webp",
        fileName: "mrmpl-product-11-375-002-abc123def456-768-webp.webp",
        height: 432,
        targetWidth: 768,
        width: 768,
      },
      {
        customId: "mrmpl-product-11-375-002-abc123def456-880-webp",
        fileName: "mrmpl-product-11-375-002-abc123def456-880-webp.webp",
        height: 495,
        targetWidth: 880,
        width: 880,
      },
      {
        customId: "mrmpl-product-11-375-002-abc123def456-1080-webp",
        fileName: "mrmpl-product-11-375-002-abc123def456-1080-webp.webp",
        height: 608,
        targetWidth: 1080,
        width: 1080,
      },
    ]);
    expect(MAX_PRODUCT_IMAGE_VARIANT_BYTES).toBe(50 * 1024);
  });

  test("does not upscale a source that is smaller than a target slot", () => {
    const variants = getProductImageVariantDescriptors({
      height: 300,
      mediaId: "abc123def456",
      partCode: "11-375-002",
      width: 400,
    });

    expect(variants.map(({ width, height }) => [width, height])).toEqual([
      [400, 300],
      [400, 300],
      [400, 300],
      [400, 300],
    ]);
  });

  test("accepts only a complete variant set for one logical asset", () => {
    const fileNames = [480, 768, 880, 1080].map(
      (width) =>
        `mrmpl-product-11-375-002-abc123def456-${width}-webp.webp`,
    );

    expect(validateProductImageVariantFilenames(fileNames)).toEqual(
      fileNames.map((fileName) => fileName.replace(/\.webp$/, "")),
    );
    expect(validateProductImageVariantFilenames(fileNames.slice(0, 3))).toBeNull();
    expect(
      validateProductImageVariantFilenames([
        ...fileNames.slice(0, 3),
        "mrmpl-product-11-375-002-different123-1080-webp.webp",
      ]),
    ).toBeNull();
  });

  test("builds a stable custom-ID URL from an UploadThing file URL", () => {
    expect(
      getProductImageVariantUrl(
        "https://abc123.ufs.sh/f/random-storage-key",
        "mrmpl-product-11-375-002-abc123def456-1080-webp",
      ),
    ).toBe(
      "https://abc123.ufs.sh/f/mrmpl-product-11-375-002-abc123def456-1080-webp",
    );
  });
});

describe("product image ordering", () => {
  test("moves an image to primary without losing its siblings", () => {
    expect(moveProductImageToPosition(["one", "two", "three"], 2, 0)).toEqual([
      "three",
      "one",
      "two",
    ]);
  });

  test("moves the primary image to secondary and promotes the former secondary", () => {
    expect(moveProductImageToPosition(["one", "two", "three"], 0, 1)).toEqual([
      "two",
      "one",
      "three",
    ]);
  });
});
