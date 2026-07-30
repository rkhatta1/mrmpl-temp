import { describe, expect, test } from "bun:test";

import {
  SITE_MEDIA_PAGES,
  getSiteMediaAsset,
  getSiteMediaGridPlacement,
  resolveSiteMediaUrl,
  validateSiteMediaReplacement,
} from "./site-media-registry";

describe("site media registry", () => {
  test("exposes unique page and asset identifiers", () => {
    const pageIds = SITE_MEDIA_PAGES.map((page) => page.id);
    const assets = SITE_MEDIA_PAGES.flatMap((page) => page.assets);
    const assetIds = assets.map((asset) => asset.id);
    const defaultSources = assets.map((asset) => asset.defaultSrc);

    expect(new Set(pageIds).size).toBe(pageIds.length);
    expect(new Set(assetIds).size).toBe(assetIds.length);
    expect(new Set(defaultSources).size).toBe(defaultSources.length);
  });

  test("allows image-for-image replacement while locking videos", () => {
    expect(
      validateSiteMediaReplacement({
        assetId: "home.category.compression",
        mimeType: "image/png",
        pageId: "home",
      }),
    ).toBeNull();

    expect(
      validateSiteMediaReplacement({
        assetId: "home.category.compression",
        mimeType: "video/webm",
        pageId: "home",
      }),
    ).toBe("Choose an image file for this image placement.");

    expect(
      validateSiteMediaReplacement({
        assetId: "home.hero-video",
        mimeType: "image/webp",
        pageId: "home",
      }),
    ).toBe("Video assets are read-only.");
  });

  test("preserves fallback sources until an override exists", () => {
    const asset = getSiteMediaAsset("about.team");
    expect(asset).not.toBeNull();

    const fallback = asset?.defaultSrc ?? "";
    expect(resolveSiteMediaUrl(fallback, [])).toBe(fallback);
    expect(
      resolveSiteMediaUrl(fallback, [
        { assetId: "about.team", url: "https://example.com/team.webp" },
      ]),
    ).toBe("https://example.com/team.webp");
  });

  test("uses intrinsic ratios and lets panoramic media span two columns", () => {
    expect(getSiteMediaGridPlacement(1080, 1080)).toEqual({
      columnSpan: 1,
      ratio: 1,
    });
    expect(getSiteMediaGridPlacement(1600, 525)).toEqual({
      columnSpan: 2,
      ratio: 1600 / 525,
    });
    expect(getSiteMediaGridPlacement(1200, 1599)).toEqual({
      columnSpan: 1,
      ratio: 1200 / 1599,
    });
  });
});
