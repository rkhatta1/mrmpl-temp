import { describe, expect, test } from "bun:test";
import { categoryService } from "./categoryService";

describe("categoryService", () => {
  test("returns local categories without requiring the old API", async () => {
    const response = await categoryService.getCategories();

    expect(response.success).toBe(true);
    expect(response.data.some((category) => category.name === "Compression Fitting")).toBe(true);
    expect(response.data.some((category) => category.name === "Pipe Fitting")).toBe(true);
  });

  test("returns local categories with subcategories for product navigation", async () => {
    const response = await categoryService.getCategoriesWithSubcategories();
    const compression = response.categories.find((category) => category.name === "Compression Fitting");
    const compressionSubcategories = response.subcategories.filter(
      (subcategory) => subcategory.category === compression?._id,
    );

    expect(response.categories.length).toBeGreaterThan(10);
    expect(response.subcategories.length).toBeGreaterThan(300);
    expect(compressionSubcategories.length).toBeGreaterThan(0);
  });
});
