import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";

const MAX_METAL_PRICES = 6;

const metalPriceFields = {
  name: v.string(),
  symbol: v.string(),
  price: v.number(),
};

const metalPriceInput = v.object(metalPriceFields);

const publicMetalPrice = v.object({
  _id: v.id("metalPrices"),
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

type NormalizedMetalPrice = {
  name: string;
  symbol: string;
  price: number;
};

function normalizeMetalPrice(input: {
  name: string;
  symbol: string;
  price: number;
}): NormalizedMetalPrice {
  const name = input.name.trim();
  const symbol = normalizedSymbol(input.symbol);

  if (!name) {
    throw new ConvexError("Enter a metal name.");
  }

  if (!symbol) {
    throw new ConvexError("Enter a metal symbol.");
  }

  if (symbol.length > 2) {
    throw new ConvexError("Metal symbols can contain at most two characters.");
  }

  if (!Number.isFinite(input.price) || input.price <= 0) {
    throw new ConvexError("Enter a price greater than zero.");
  }

  return { name, symbol, price: input.price };
}

function normalizedName(value: string) {
  return value.trim().toLocaleLowerCase("en");
}

function normalizedSymbol(value: string) {
  return value.trim().toLocaleUpperCase("en");
}

function roundToTwoDecimalPlaces(value: number) {
  return Number(value.toFixed(2));
}

function assertUniqueMetal(
  prices: Doc<"metalPrices">[],
  input: NormalizedMetalPrice,
  currentId?: Id<"metalPrices">,
) {
  const duplicateName = prices.find(
    (price) =>
      price._id !== currentId &&
      normalizedName(price.name) === normalizedName(input.name),
  );

  if (duplicateName) {
    throw new ConvexError(`${duplicateName.name} is already in the list.`);
  }

  const duplicateSymbol = prices.find(
    (price) =>
      price._id !== currentId &&
      normalizedSymbol(price.symbol) === input.symbol,
  );

  if (duplicateSymbol) {
    throw new ConvexError(`The symbol ${input.symbol} is already in use.`);
  }
}

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
    name: price.name,
    symbol: price.symbol,
    price: price.price,
    change: price.change,
    changePercent: roundToTwoDecimalPlaces(price.changePercent),
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
  args: metalPriceInput,
  returns: v.id("metalPrices"),
  handler: async (ctx, args) => {
    const identity = await requireAdminIdentity(ctx);
    const prices = await getBoundedMetalPrices(ctx);

    if (prices.length >= MAX_METAL_PRICES) {
      throw new ConvexError("You can add up to six metals.");
    }

    const input = normalizeMetalPrice(args);
    assertUniqueMetal(prices, input);

    const sortOrder =
      prices.reduce((highest, price) => Math.max(highest, price.sortOrder), 0) +
      1;

    return ctx.db.insert("metalPrices", {
      ...input,
      change: 0,
      changePercent: 0,
      unit: "per ton",
      currency: "USD",
      sortOrder,
      updatedAt: Date.now(),
      updatedBy: identity.email ?? identity.subject,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("metalPrices"),
    ...metalPriceFields,
  },
  returns: v.id("metalPrices"),
  handler: async (ctx, args) => {
    const identity = await requireAdminIdentity(ctx);
    const existing = await ctx.db.get(args.id);

    if (!existing) {
      throw new ConvexError("That metal no longer exists.");
    }

    const prices = await getBoundedMetalPrices(ctx);
    const input = normalizeMetalPrice(args);
    assertUniqueMetal(prices, input, args.id);

    if (
      existing.name === input.name &&
      existing.symbol === input.symbol &&
      existing.price === input.price
    ) {
      return existing._id;
    }

    const change = input.price - existing.price;
    const changePercent = roundToTwoDecimalPlaces(
      (change / existing.price) * 100,
    );

    await ctx.db.patch(existing._id, {
      ...input,
      change,
      changePercent,
      updatedAt: Date.now(),
      updatedBy: identity.email ?? identity.subject,
    });

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
