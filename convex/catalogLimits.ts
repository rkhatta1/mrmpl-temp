import { ConvexError } from "convex/values";

import type { MutationCtx } from "./_generated/server";

export const MAX_CATALOG_CATEGORIES = 200;
export const MAX_CATALOG_SUBCATEGORIES = 2_000;
export const MAX_CATALOG_PRODUCTS = 5_000;

type CatalogAdditions = {
  categories?: number;
  products?: number;
  subcategories?: number;
};

const CAPACITY_KEY = "catalog";

export function normalizeCatalogKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function additions(value: number | undefined) {
  return value ?? 0;
}

function assertWithinCatalogLimits(
  counts: {
    categoryCount: number;
    productCount: number;
    subcategoryCount: number;
  },
  requested: CatalogAdditions,
) {
  if (
    counts.productCount + additions(requested.products) >
    MAX_CATALOG_PRODUCTS
  ) {
    throw new ConvexError(
      `The catalog can contain at most ${MAX_CATALOG_PRODUCTS} products.`,
    );
  }
  if (
    counts.categoryCount + additions(requested.categories) >
    MAX_CATALOG_CATEGORIES
  ) {
    throw new ConvexError(
      `The catalog can contain at most ${MAX_CATALOG_CATEGORIES} categories.`,
    );
  }
  if (
    counts.subcategoryCount + additions(requested.subcategories) >
    MAX_CATALOG_SUBCATEGORIES
  ) {
    throw new ConvexError(
      `The catalog can contain at most ${MAX_CATALOG_SUBCATEGORIES} subcategories.`,
    );
  }
}

async function catalogCapacity(ctx: MutationCtx) {
  const existing = await ctx.db
    .query("catalogCapacity")
    .withIndex("by_key", (query) => query.eq("key", CAPACITY_KEY))
    .unique();
  if (existing) return existing;

  const [categories, subcategories, products] = await Promise.all([
    ctx.db
      .query("categories")
      .withIndex("by_name")
      .take(MAX_CATALOG_CATEGORIES + 1),
    ctx.db
      .query("subcategories")
      .withIndex("by_name")
      .take(MAX_CATALOG_SUBCATEGORIES + 1),
    ctx.db
      .query("products")
      .withIndex("by_part_code")
      .take(MAX_CATALOG_PRODUCTS + 1),
  ]);
  const counts = {
    categoryCount: categories.length,
    productCount: products.length,
    subcategoryCount: subcategories.length,
  };
  assertWithinCatalogLimits(counts, {});

  const id = await ctx.db.insert("catalogCapacity", {
    key: CAPACITY_KEY,
    ...counts,
    updatedAt: Date.now(),
  });
  const created = await ctx.db.get(id);
  if (!created)
    throw new ConvexError("Catalog capacity could not be initialized.");
  return created;
}

export async function assertCatalogCapacity(
  ctx: MutationCtx,
  requested: CatalogAdditions,
) {
  const capacity = await catalogCapacity(ctx);
  assertWithinCatalogLimits(capacity, requested);
}

export async function reserveCatalogCapacity(
  ctx: MutationCtx,
  requested: CatalogAdditions,
) {
  const capacity = await catalogCapacity(ctx);
  assertWithinCatalogLimits(capacity, requested);
  await ctx.db.patch(capacity._id, {
    categoryCount: capacity.categoryCount + additions(requested.categories),
    productCount: capacity.productCount + additions(requested.products),
    subcategoryCount:
      capacity.subcategoryCount + additions(requested.subcategories),
    updatedAt: Date.now(),
  });
}

export async function releaseCatalogCapacity(
  ctx: MutationCtx,
  released: CatalogAdditions,
) {
  const capacity = await catalogCapacity(ctx);
  await ctx.db.patch(capacity._id, {
    categoryCount: Math.max(
      0,
      capacity.categoryCount - additions(released.categories),
    ),
    productCount: Math.max(
      0,
      capacity.productCount - additions(released.products),
    ),
    subcategoryCount: Math.max(
      0,
      capacity.subcategoryCount - additions(released.subcategories),
    ),
    updatedAt: Date.now(),
  });
}

export async function invalidateCatalogCapacity(ctx: MutationCtx) {
  const capacity = await ctx.db
    .query("catalogCapacity")
    .withIndex("by_key", (query) => query.eq("key", CAPACITY_KEY))
    .unique();
  if (capacity) await ctx.db.delete(capacity._id);
}
