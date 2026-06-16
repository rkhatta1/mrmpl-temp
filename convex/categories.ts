import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

export const listSubcategories = query({
  args: { categoryExternalId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.categoryExternalId) {
      return await ctx.db
        .query("subcategories")
        .withIndex("by_category", (q) => q.eq("categoryExternalId", args.categoryExternalId!))
        .collect();
    }
    return await ctx.db.query("subcategories").collect();
  },
});

export const seed = mutation({
  args: {
    categories: v.array(v.any()),
    subcategories: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    for (const category of args.categories) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_external_id", (q) => q.eq("externalId", category._id))
        .first();
      const doc = {
        externalId: category._id,
        name: category.name,
        description: category.description,
      };
      if (existing) {
        await ctx.db.patch(existing._id, doc);
      } else {
        await ctx.db.insert("categories", doc);
      }
    }

    for (const subcategory of args.subcategories) {
      const existing = await ctx.db
        .query("subcategories")
        .withIndex("by_external_id", (q) => q.eq("externalId", subcategory._id))
        .first();
      const doc = {
        externalId: subcategory._id,
        name: subcategory.name,
        categoryExternalId: subcategory.category,
      };
      if (existing) {
        await ctx.db.patch(existing._id, doc);
      } else {
        await ctx.db.insert("subcategories", doc);
      }
    }

    return {
      categories: args.categories.length,
      subcategories: args.subcategories.length,
    };
  },
});
