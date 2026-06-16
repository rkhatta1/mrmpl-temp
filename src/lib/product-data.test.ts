import { describe, expect, test } from "bun:test";
import {
  findLocalProductByPartCode,
  getAllLocalProducts,
  listLocalProducts,
} from "./product-data";

describe("local product data", () => {
  test("loads copied product metadata for the products page", () => {
    expect(getAllLocalProducts().length).toBeGreaterThan(2000);
  });

  test("serves the same high-limit shape the products page expects", () => {
    const response = listLocalProducts(new URLSearchParams("limit=10000"));

    expect(response.data.length).toBeGreaterThan(2000);
    expect(response.pagination.pages).toBe(1);
    expect(response.data[0]).toHaveProperty("_id");
    expect(response.data[0]).toHaveProperty("images");
  });

  test("can resolve assembly lookups by part code", () => {
    const product = findLocalProductByPartCode("03-163-001");

    expect(product?.partCode).toBe("03-163-001");
  });
});
