import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function normalize(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

type SearchableProduct = {
  productName?: string;
  partCode?: string;
  material?: string;
  type?: string;
  description?: string;
};

function matchesSearch(product: SearchableProduct, search: string) {
  if (!search) return true;
  return [
    product.productName,
    product.partCode,
    product.material,
    product.type,
    product.description,
  ].some((value) => normalize(value).includes(search));
}

function matchesField(value: unknown, expected: string | undefined) {
  if (!expected) return true;
  return normalize(value) === normalize(expected);
}

export const list = query({
  args: {
    limit: v.optional(v.number()),
    page: v.optional(v.number()),
    search: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    subCategoryId: v.optional(v.string()),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const page = Math.max(args.page ?? 1, 1);
    const limit = Math.max(args.limit ?? 10, 1);
    const search = normalize(args.search);

    const allProducts = await ctx.db.query("products").collect();
    const filtered = allProducts.filter((product) => {
      if (!args.includeInactive && product.isActive === false) return false;
      if (!matchesField(product.category._id, args.categoryId) && !matchesField(product.category.name, args.categoryId)) return false;
      if (!matchesField(product.subCategory._id, args.subCategoryId) && !matchesField(product.subCategory.name, args.subCategoryId)) return false;
      return matchesSearch(product, search);
    });

    if (args.includeInactive || limit >= 10000) {
      return {
        data: filtered,
        pagination: {
          current: page,
          pages: 1,
          total: filtered.length,
        },
      };
    }

    const start = (page - 1) * limit;
    return {
      data: filtered.slice(start, start + limit),
      pagination: {
        current: page,
        pages: Math.ceil(filtered.length / limit),
        total: filtered.length,
      },
    };
  },
});

export const get = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.id))
      .first();
  },
});

export const byPartCode = query({
  args: { partCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_part_code", (q) => q.eq("partCode", args.partCode))
      .first();
  },
});

export const related = query({
  args: { id: v.string(), count: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.id))
      .first();
    if (!product) return [];

    const count = args.count ?? 3;
    const allProducts = await ctx.db.query("products").collect();
    const candidates = allProducts.filter(
      (candidate) => candidate.externalId !== product.externalId && candidate.isActive !== false,
    );

    const sameSubcategory = candidates.filter(
      (candidate) => candidate.subCategory.name === product.subCategory.name,
    );
    const sameCategory = candidates.filter(
      (candidate) =>
        candidate.category.name === product.category.name &&
        candidate.subCategory.name !== product.subCategory.name,
    );

    return [...sameSubcategory, ...sameCategory].slice(0, count);
  },
});

export const seedBatch = mutation({
  args: { products: v.array(v.any()) },
  handler: async (ctx, args) => {
    let upserted = 0;

    for (const product of args.products) {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_external_id", (q) => q.eq("externalId", product._id))
        .first();

      const doc = {
        externalId: product._id,
        productName: product.productName,
        partCode: product.partCode,
        category: product.category,
        subCategory: product.subCategory,
        size: product.size,
        material: product.material,
        type: product.type,
        finishPlating: product.finishPlating,
        threadStandard: product.threadStandard,
        sealant: product.sealant,
        temperature: product.temperature,
        pressure: product.pressure,
        connections: product.connections,
        assemblies: product.assemblies,
        grade: product.grade,
        description: product.description,
        applications: product.applications,
        certifications: product.certifications,
        additionalNotes: product.additionalNotes,
        dimensions: product.dimensions,
        images: product.images,
        isActive: product.isActive,
        createdAt: product.createdAt,
      };

      if (existing) {
        await ctx.db.patch(existing._id, doc);
      } else {
        await ctx.db.insert("products", doc);
      }
      upserted += 1;
    }

    return { upserted };
  },
});
