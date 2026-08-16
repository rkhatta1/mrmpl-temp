import { describe, expect, test } from "bun:test";

import {
  BULK_PRODUCT_PHOTO_VARIANT_WIDTHS,
  getBulkProductPhotoVariantDescriptors,
  getBulkProductPhotoVariantUrl,
  validateBulkProductPhotoVariantFilenames,
} from "./bulk-product-photo-contract";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

describe("bulk product photo variants", () => {
  test("plans and validates complete responsive sets for deduplicated content hashes", () => {
    const first = getBulkProductPhotoVariantDescriptors({
      contentHash: HASH_A,
      height: 800,
      width: 1200,
    });
    const second = getBulkProductPhotoVariantDescriptors({
      contentHash: HASH_B,
      height: 600,
      width: 600,
    });

    expect(first.map((variant) => variant.targetWidth)).toEqual(
      [...BULK_PRODUCT_PHOTO_VARIANT_WIDTHS],
    );
    expect(first[3]).toMatchObject({ width: 1080, height: 720 });
    expect(second[3]).toMatchObject({ width: 600, height: 600 });
    expect(
      validateBulkProductPhotoVariantFilenames(
        [...first, ...second].map((variant) => variant.fileName),
      ),
    ).toEqual([...first, ...second].map((variant) => variant.customId));
    expect(
      getBulkProductPhotoVariantUrl(
        "https://example.ufs.sh/f/random-key",
        first[3].customId,
      ),
    ).toBe(`https://example.ufs.sh/f/${first[3].customId}`);
  });

  test("rejects duplicate or incomplete content-hash sets", () => {
    const variants = getBulkProductPhotoVariantDescriptors({
      contentHash: HASH_A,
      height: 800,
      width: 1200,
    });

    expect(
      validateBulkProductPhotoVariantFilenames(
        variants.slice(0, 3).map((variant) => variant.fileName),
      ),
    ).toBeNull();
    expect(
      validateBulkProductPhotoVariantFilenames(
        [...variants, variants[0]].map((variant) => variant.fileName),
      ),
    ).toBeNull();
  });
});
