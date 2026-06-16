import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE_ROOT = join(import.meta.dir, "..");
const CHECKED_FILES = [
  "components/Header.tsx",
  "components/Footer.tsx",
  "components/LazyImage.tsx",
  "features/site/pages/About.tsx",
  "features/site/pages/BuffoliMachines.tsx",
  "features/site/pages/Capabilities.tsx",
  "features/site/pages/CNCMachining.tsx",
  "features/site/pages/Contact.tsx",
  "features/site/pages/CustomAssembly.tsx",
  "features/site/pages/Home.tsx",
  "features/site/pages/ISO9001.tsx",
  "features/site/pages/InHouseManufacturing.tsx",
  "features/site/pages/LeadFree.tsx",
  "features/site/pages/NSFCertified.tsx",
  "features/site/pages/OneStopSolution.tsx",
  "features/site/pages/Quality.tsx",
  "features/site/pages/RetailSolutions.tsx",
  "hooks/useSEO.ts",
];

const ORIGINAL_SITE_IMAGE_PATTERN =
  /["']\/(?:about|capabilities|csr|quality)\/[^"']+\.(?:png|jpe?g|webp|heic|heif)["']|["']\/(?:contact\.JPG|journey\.jpe?g|journey\.svg|logo\.png)["']/gi;

const ORIGINAL_VIDEO_PATTERN = /["']\/(?:home-hero|about-us)\.mp4["']/g;

describe("static site image assets", () => {
  test("uses optimized assets for hard-coded site image references", () => {
    const offenders = CHECKED_FILES.flatMap((file) => {
      const source = readFileSync(join(SOURCE_ROOT, file), "utf8");
      return Array.from(source.matchAll(ORIGINAL_SITE_IMAGE_PATTERN), (match) => `${file}: ${match[0]}`);
    });

    expect(offenders).toEqual([]);
  });

  test("uses optimized WebM assets for migrated site videos", () => {
    const checkedFiles = ["components/HeroSection.tsx", "features/site/pages/About.tsx"];
    const offenders = checkedFiles.flatMap((file) => {
      const source = readFileSync(join(SOURCE_ROOT, file), "utf8");
      return Array.from(source.matchAll(ORIGINAL_VIDEO_PATTERN), (match) => `${file}: ${match[0]}`);
    });

    expect(offenders).toEqual([]);
  });

  test("uses local optimized images for home product category cards", () => {
    const source = readFileSync(join(SOURCE_ROOT, "components/ProductCategoriesSection.tsx"), "utf8");

    expect(source).not.toContain("placehold.co");
    expect(source).toContain("getOptimizedProductImagePath");
    expect(source).toContain("HOME_CATEGORY_IMAGE_PART_CODES");
  });
});
