import { describe, expect, test } from "bun:test";

import {
  MAX_SITE_MEDIA_IMAGE_VARIANT_BYTES,
  getSiteMediaImageVariantDescriptors,
  getSiteMediaImageVariantUrl,
  validateSiteMediaImageVariantFilenames,
} from "./site-media-image-contract";

describe("site media responsive image variants", () => {
  test("plans and validates the same four-file upload contract as product images", () => {
    const variants = getSiteMediaImageVariantDescriptors({
      height: 900,
      mediaId: "abc123def456",
      width: 1600,
    });

    expect(
      variants.map(({ customId, height, targetWidth, width }) => ({
        customId,
        height,
        targetWidth,
        width,
      })),
    ).toEqual([
      {
        customId: "mrmpl-site-abc123def456-480-webp",
        height: 270,
        targetWidth: 480,
        width: 480,
      },
      {
        customId: "mrmpl-site-abc123def456-768-webp",
        height: 432,
        targetWidth: 768,
        width: 768,
      },
      {
        customId: "mrmpl-site-abc123def456-880-webp",
        height: 495,
        targetWidth: 880,
        width: 880,
      },
      {
        customId: "mrmpl-site-abc123def456-1080-webp",
        height: 608,
        targetWidth: 1080,
        width: 1080,
      },
    ]);
    expect(MAX_SITE_MEDIA_IMAGE_VARIANT_BYTES).toBe(800 * 1024);
    expect(
      validateSiteMediaImageVariantFilenames(
        variants.map(({ fileName }) => fileName),
      ),
    ).toEqual(variants.map(({ customId }) => customId));
    expect(
      validateSiteMediaImageVariantFilenames(
        variants.slice(0, 3).map(({ fileName }) => fileName),
      ),
    ).toBeNull();
    expect(
      getSiteMediaImageVariantUrl(
        "https://abc123.ufs.sh/f/random-storage-key",
        variants.at(-1)?.customId,
      ),
    ).toBe("https://abc123.ufs.sh/f/mrmpl-site-abc123def456-1080-webp");
  });
});
