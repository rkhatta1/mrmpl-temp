import { describe, expect, test } from "bun:test";
import path from "node:path";

import { createPlaceholder } from "./image-placeholder";

const REPO_ROOT = path.resolve(import.meta.dir, "..");
const TEST_IMAGE_PATH = path.join(
  REPO_ROOT,
  "public",
  "optimized",
  "site",
  "logo-86.webp",
);

describe("createPlaceholder", () => {
  test("falls back when the Bun image API is unavailable", async () => {
    const metadata = await createPlaceholder(
      TEST_IMAGE_PATH,
      () => ({}) as ReturnType<typeof Bun.file>,
    );

    expect(metadata.blurDataURL).toMatch(/^data:image\/webp;base64,/);
    expect(metadata.width).toBeGreaterThan(0);
    expect(metadata.height).toBeGreaterThan(0);
  });
});
