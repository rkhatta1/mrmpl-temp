import { describe, expect, test } from "bun:test";
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";

import schema from "./schema";

const modules = {
  "./catalogAdmin.ts": () => import("./catalogAdmin"),
  "./_generated/server.js": () => import("./_generated/server.js"),
};

const listCatalog = makeFunctionReference<"query", Record<string, never>, {
  categories: Array<{
    externalId: string;
    name: string;
    description: string;
  }>;
  subcategories: Array<{
    externalId: string;
    name: string;
    categoryExternalId: string;
  }>;
  products: Array<{
    externalId: string;
    productName: string;
    partCode: string;
    categoryExternalId: string;
    subcategoryExternalId: string;
    isActive: boolean;
  }>;
}>("catalogAdmin:listCatalog");

const createCategory = makeFunctionReference<
  "mutation",
  { name: string; description: string },
  { externalId: string }
>("catalogAdmin:createCategory");

const createSubcategory = makeFunctionReference<
  "mutation",
  { name: string; categoryExternalId: string },
  { externalId: string }
>("catalogAdmin:createSubcategory");

const createProduct = makeFunctionReference<
  "mutation",
  { product: ProductInput },
  { externalId: string }
>("catalogAdmin:createProduct");

const getProduct = makeFunctionReference<
  "query",
  { externalId: string },
  (ProductInput & { externalId: string; createdAt: string | null }) | null
>("catalogAdmin:getProduct");

const updateCategory = makeFunctionReference<
  "mutation",
  { externalId: string; name: string; description: string },
  null
>("catalogAdmin:updateCategory");

const updateSubcategory = makeFunctionReference<
  "mutation",
  { externalId: string; name: string; categoryExternalId: string },
  null
>("catalogAdmin:updateSubcategory");

const updateProduct = makeFunctionReference<
  "mutation",
  { externalId: string; product: ProductInput },
  null
>("catalogAdmin:updateProduct");

const deleteCategory = makeFunctionReference<
  "mutation",
  { externalId: string },
  null
>("catalogAdmin:deleteCategory");

const deleteSubcategory = makeFunctionReference<
  "mutation",
  { externalId: string },
  null
>("catalogAdmin:deleteSubcategory");

const deleteProduct = makeFunctionReference<
  "mutation",
  { externalId: string },
  null
>("catalogAdmin:deleteProduct");

type ProductInput = {
  productName: string;
  partCode: string;
  categoryExternalId: string;
  subcategoryExternalId: string;
  size: string;
  material: string;
  type: string;
  finishPlating: string;
  threadStandard: string;
  sealant: string;
  temperature: string;
  pressure: string;
  connections: string;
  assemblies: string;
  grade: string;
  description: string;
  applications: string[];
  certifications: string[];
  additionalNotes: string[];
  dimensions: Array<{ parameter: string; value: string; notes?: string }>;
  images: string[];
  isActive: boolean;
};

describe("catalog admin", () => {
  test("requires authentication and exposes created categories in the catalog", async () => {
    const t = convexTest(schema, modules);

    await expect(t.query(listCatalog, {})).rejects.toThrow("signed in");

    const asAdmin = t.withIdentity({ name: "Admin" });
    const created = await asAdmin.mutation(createCategory, {
      name: "Dot Fitting",
      description: "DOT air-brake fittings",
    });

    expect(created.externalId).toBeTruthy();
    expect(await asAdmin.query(listCatalog, {})).toEqual({
      categories: [
        {
          externalId: created.externalId,
          name: "Dot Fitting",
          description: "DOT air-brake fittings",
        },
      ],
      subcategories: [],
      products: [],
    });
  });

  test("creates a two-tier hierarchy and returns full product details", async () => {
    const t = convexTest(schema, modules).withIdentity({ name: "Admin" });
    const category = await t.mutation(createCategory, {
      name: "Dot Fitting",
      description: "",
    });
    const subcategory = await t.mutation(createSubcategory, {
      name: "Push On Dot Sleeve",
      categoryExternalId: category.externalId,
    });
    const product: ProductInput = {
      productName: "3/4 Push On Dot Sleeve",
      partCode: "34-PUSH",
      categoryExternalId: category.externalId,
      subcategoryExternalId: subcategory.externalId,
      size: "3/4 in",
      material: "Brass",
      type: "Sleeve",
      finishPlating: "Natural",
      threadStandard: "",
      sealant: "",
      temperature: "-40 C to 100 C",
      pressure: "150 PSI",
      connections: "Push-on",
      assemblies: "",
      grade: "C360",
      description: "DOT push-on sleeve.",
      applications: ["Air brake"],
      certifications: ["DOT"],
      additionalNotes: [],
      dimensions: [{ parameter: "OD", value: "3/4 in" }],
      images: ["https://example.com/sleeve.webp"],
      isActive: true,
    };
    const created = await t.mutation(createProduct, { product });

    await t.run(async (ctx) => {
      const stored = await ctx.db
        .query("products")
        .withIndex("by_external_id", (q) =>
          q.eq("externalId", created.externalId),
        )
        .unique();
      if (!stored) throw new Error("Product fixture was not created.");
      await ctx.db.patch(stored._id, {
        category: { _id: "Dot Fitting", name: "Dot Fitting" },
        subCategory: {
          _id: "Push On Dot Sleeve",
          name: "Push On Dot Sleeve",
        },
        categoryExternalId: undefined,
        subcategoryExternalId: undefined,
      });
    });

    expect(await t.query(getProduct, { externalId: created.externalId })).toEqual({
      ...product,
      externalId: created.externalId,
      createdAt: expect.any(String),
    });
    expect((await t.query(listCatalog, {})).products).toEqual([
      {
        externalId: created.externalId,
        productName: product.productName,
        partCode: product.partCode,
        categoryExternalId: category.externalId,
        subcategoryExternalId: subcategory.externalId,
        isActive: true,
      },
    ]);
  });

  test("cascades renames and blocks deletion until child records are removed", async () => {
    const t = convexTest(schema, modules).withIdentity({ name: "Admin" });
    const category = await t.mutation(createCategory, {
      name: "Dot Fitting",
      description: "",
    });
    const subcategory = await t.mutation(createSubcategory, {
      name: "Push On Dot Sleeve",
      categoryExternalId: category.externalId,
    });
    const product: ProductInput = {
      productName: "3/4 Push On Dot Sleeve",
      partCode: "34-PUSH",
      categoryExternalId: category.externalId,
      subcategoryExternalId: subcategory.externalId,
      size: "",
      material: "Brass",
      type: "",
      finishPlating: "",
      threadStandard: "",
      sealant: "",
      temperature: "",
      pressure: "",
      connections: "",
      assemblies: "",
      grade: "",
      description: "",
      applications: [],
      certifications: [],
      additionalNotes: [],
      dimensions: [],
      images: [],
      isActive: true,
    };
    const created = await t.mutation(createProduct, { product });

    await t.run(async (ctx) => {
      const stored = await ctx.db
        .query("products")
        .withIndex("by_external_id", (q) =>
          q.eq("externalId", created.externalId),
        )
        .unique();
      if (!stored) throw new Error("Product fixture was not created.");
      await ctx.db.patch(stored._id, {
        categoryExternalId: undefined,
        subcategoryExternalId: undefined,
      });
    });

    await t.mutation(updateCategory, {
      externalId: category.externalId,
      name: "DOT Fittings",
      description: "Updated",
    });
    await t.mutation(updateSubcategory, {
      externalId: subcategory.externalId,
      name: "Push-On Sleeves",
      categoryExternalId: category.externalId,
    });
    await t.mutation(updateProduct, {
      externalId: created.externalId,
      product: { ...product, productName: "3/4 Push-On Sleeve" },
    });

    expect(await t.query(getProduct, { externalId: created.externalId })).toMatchObject({
      productName: "3/4 Push-On Sleeve",
      categoryExternalId: category.externalId,
      subcategoryExternalId: subcategory.externalId,
    });
    expect(
      await t.run(async (ctx) => {
        const stored = await ctx.db
          .query("products")
          .withIndex("by_external_id", (q) =>
            q.eq("externalId", created.externalId),
          )
          .unique();
        return stored
          ? {
              category: stored.category,
              subCategory: stored.subCategory,
              categoryExternalId: stored.categoryExternalId,
              subcategoryExternalId: stored.subcategoryExternalId,
            }
          : null;
      }),
    ).toEqual({
      category: { _id: category.externalId, name: "DOT Fittings" },
      subCategory: {
        _id: subcategory.externalId,
        name: "Push-On Sleeves",
      },
      categoryExternalId: category.externalId,
      subcategoryExternalId: subcategory.externalId,
    });
    await expect(
      t.mutation(deleteCategory, { externalId: category.externalId }),
    ).rejects.toThrow("subcategories");
    await expect(
      t.mutation(deleteSubcategory, { externalId: subcategory.externalId }),
    ).rejects.toThrow("product");

    await t.mutation(deleteProduct, { externalId: created.externalId });
    await t.mutation(deleteSubcategory, { externalId: subcategory.externalId });
    await t.mutation(deleteCategory, { externalId: category.externalId });
    expect(await t.query(listCatalog, {})).toEqual({
      categories: [],
      subcategories: [],
      products: [],
    });
  });
});
