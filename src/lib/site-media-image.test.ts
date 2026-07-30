import { describe, expect, test } from "bun:test";

import { getSiteMediaImagePlan } from "./site-media-image";

describe("site media image optimization", () => {
  test("keeps reasonably sized WebP and AVIF images unchanged", () => {
    expect(
      getSiteMediaImagePlan({
        height: 900,
        mimeType: "image/webp",
        size: 420_000,
        width: 1600,
      }),
    ).toEqual({ height: 900, shouldTranscode: false, width: 1600 });

    expect(
      getSiteMediaImagePlan({
        height: 1200,
        mimeType: "image/avif",
        size: 350_000,
        width: 800,
      }),
    ).toEqual({ height: 1200, shouldTranscode: false, width: 800 });
  });

  test("downscales large images without changing their aspect ratio", () => {
    expect(
      getSiteMediaImagePlan({
        height: 3000,
        mimeType: "image/png",
        size: 12_000_000,
        width: 4000,
      }),
    ).toEqual({ height: 1800, shouldTranscode: true, width: 2400 });
  });

  test("transcodes non-optimized raster formats even when dimensions are small", () => {
    expect(
      getSiteMediaImagePlan({
        height: 800,
        mimeType: "image/jpeg",
        size: 900_000,
        width: 1200,
      }),
    ).toEqual({ height: 800, shouldTranscode: true, width: 1200 });
  });
});
