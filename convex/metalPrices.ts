import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { getSelectableMetal } from "./lib/metalsDev";

const MAX_METAL_PRICES = 6;

const publicMetalPrice = v.object({
  _id: v.id("metalPrices"),
  apiCode: v.optional(v.string()),
  name: v.string(),
  symbol: v.string(),
  price: v.number(),
  change: v.number(),
  changePercent: v.number(),
  unit: v.string(),
  currency: v.string(),
  sortOrder: v.number(),
  updatedAt: v.number(),
});

async function requireAdminIdentity(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("You must be signed in to manage metal prices.");
  }

  return identity;
}

async function getBoundedMetalPrices(ctx: MutationCtx) {
  return ctx.db
    .query("metalPrices")
    .withIndex("by_sort_order")
    .take(MAX_METAL_PRICES + 1);
}

function toPublicMetalPrice(price: Doc<"metalPrices">) {
  return {
    _id: price._id,
    apiCode: price.apiCode,
    name: price.name,
    symbol: price.symbol,
    price: price.price,
    change: price.change,
    changePercent: Number(price.changePercent.toFixed(2)),
    unit: price.unit,
    currency: price.currency,
    sortOrder: price.sortOrder,
    updatedAt: price.updatedAt,
  };
}

async function getPublicMetalPrices(ctx: QueryCtx) {
  const prices = await ctx.db
    .query("metalPrices")
    .withIndex("by_sort_order")
    .take(MAX_METAL_PRICES);

  return prices.map(toPublicMetalPrice);
}

async function getMetalSource(ctx: MutationCtx, apiCode: string) {
  const catalogueMetal = getSelectableMetal(apiCode);
  const marketPrice = await ctx.db
    .query("metalMarketPrices")
    .withIndex("by_api_code", (q) => q.eq("apiCode", apiCode))
    .unique();

  if (!catalogueMetal || !marketPrice) {
    throw new ConvexError("Choose a metal from the synced metals.dev list.");
  }

  return { catalogueMetal, marketPrice };
}

function assertUniqueMetal(
  prices: Doc<"metalPrices">[],
  apiCode: string,
  symbol: string,
  currentId?: Id<"metalPrices">,
) {
  const duplicate = prices.find(
    (price) =>
      price._id !== currentId &&
      (price.apiCode === apiCode || price.symbol === symbol),
  );

  if (duplicate) {
    throw new ConvexError(`${duplicate.name} is already in the list.`);
  }
}

function selectedMetalDocument({
  catalogueMetal,
  marketPrice,
  updatedBy,
}: {
  catalogueMetal: {
    apiCode: string;
    name: string;
    symbol: string;
  };
  marketPrice: Doc<"metalMarketPrices">;
  updatedBy: string;
}) {
  return {
    apiCode: catalogueMetal.apiCode,
    name: catalogueMetal.name,
    symbol: catalogueMetal.symbol,
    price: marketPrice.price,
    change: marketPrice.change,
    changePercent: Number(marketPrice.changePercent.toFixed(2)),
    unit: marketPrice.unit,
    currency: marketPrice.currency,
    sourceTimestamp: marketPrice.sourceTimestamp,
    updatedAt: marketPrice.updatedAt,
    updatedBy,
  };
}

export const listPublic = query({
  args: {},
  returns: v.array(publicMetalPrice),
  handler: getPublicMetalPrices,
});

export const list = query({
  args: {},
  returns: v.array(publicMetalPrice),
  handler: async (ctx) => {
    await requireAdminIdentity(ctx);
    return getPublicMetalPrices(ctx);
  },
});

export const create = mutation({
  args: { apiCode: v.string() },
  returns: v.id("metalPrices"),
  handler: async (ctx, args) => {
    const identity = await requireAdminIdentity(ctx);
    const [prices, source] = await Promise.all([
      getBoundedMetalPrices(ctx),
      getMetalSource(ctx, args.apiCode),
    ]);

    if (prices.length >= MAX_METAL_PRICES) {
      throw new ConvexError("You can add up to six metals.");
    }

    assertUniqueMetal(
      prices,
      source.catalogueMetal.apiCode,
      source.catalogueMetal.symbol,
    );

    const sortOrder =
      prices.reduce((highest, price) => Math.max(highest, price.sortOrder), 0) +
      1;

    return ctx.db.insert("metalPrices", {
      ...selectedMetalDocument({
        ...source,
        updatedBy: identity.email ?? identity.subject,
      }),
      sortOrder,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("metalPrices"),
    apiCode: v.string(),
  },
  returns: v.id("metalPrices"),
  handler: async (ctx, args) => {
    const identity = await requireAdminIdentity(ctx);
    const existing = await ctx.db.get(args.id);

    if (!existing) {
      throw new ConvexError("That metal no longer exists.");
    }

    if (existing.apiCode === args.apiCode) {
      return existing._id;
    }

    const [prices, source] = await Promise.all([
      getBoundedMetalPrices(ctx),
      getMetalSource(ctx, args.apiCode),
    ]);
    assertUniqueMetal(
      prices,
      source.catalogueMetal.apiCode,
      source.catalogueMetal.symbol,
      args.id,
    );

    await ctx.db.patch(
      existing._id,
      selectedMetalDocument({
        ...source,
        updatedBy: identity.email ?? identity.subject,
      }),
    );

    return existing._id;
  },
});

export const remove = mutation({
  args: { id: v.id("metalPrices") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx);

    if (!(await ctx.db.get(args.id))) {
      throw new ConvexError("That metal no longer exists.");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});
