import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const metalPriceInput = v.object({
  name: v.string(),
  symbol: v.string(),
  price: v.number(),
  change: v.optional(v.number()),
  changePercent: v.optional(v.number()),
  unit: v.optional(v.string()),
  currency: v.optional(v.string()),
  sortOrder: v.optional(v.number()),
});

type MetalPriceInput = {
  name: string;
  symbol: string;
  price: number;
  change?: number;
  changePercent?: number;
  unit?: string;
  currency?: string;
  sortOrder?: number;
};

const DEFAULT_METAL_PRICES: MetalPriceInput[] = [
  { name: "Copper", symbol: "CU", price: 13626.89, unit: "per ton", currency: "USD", sortOrder: 1 },
  { name: "Zinc", symbol: "ZN", price: 3503.49, unit: "per ton", currency: "USD", sortOrder: 2 },
  { name: "Lead", symbol: "PB", price: 1892.6, unit: "per ton", currency: "USD", sortOrder: 3 },
];

function normalizeFiniteNumber(value: number, label: string) {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function normalizeMetalPrice(input: MetalPriceInput, index: number, updatedBy: string) {
  const name = input.name.trim();
  const symbol = input.symbol.trim().toUpperCase();
  if (!name) throw new Error("Metal name is required");
  if (!symbol) throw new Error("Metal symbol is required");

  return {
    name,
    symbol,
    price: normalizeFiniteNumber(input.price, `${symbol} price`),
    change: normalizeFiniteNumber(input.change ?? 0, `${symbol} change`),
    changePercent: normalizeFiniteNumber(input.changePercent ?? 0, `${symbol} changePercent`),
    unit: input.unit?.trim() || "per ton",
    currency: input.currency?.trim().toUpperCase() || "USD",
    sortOrder: normalizeFiniteNumber(input.sortOrder ?? index + 1, `${symbol} sortOrder`),
    updatedAt: Date.now(),
    updatedBy,
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const prices = await ctx.db.query("metalPrices").collect();
    return prices.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  },
});

export const upsertMany = mutation({
  args: {
    prices: v.array(metalPriceInput),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updatedBy = args.updatedBy?.trim() || "convex-cli";
    const normalizedPrices = args.prices.map((price, index) =>
      normalizeMetalPrice(price, index, updatedBy),
    );

    for (const price of normalizedPrices) {
      const existing = await ctx.db
        .query("metalPrices")
        .withIndex("by_symbol", (q) => q.eq("symbol", price.symbol))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, price);
      } else {
        await ctx.db.insert("metalPrices", price);
      }
    }

    return { upserted: normalizedPrices.length };
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const updatedBy = "seed-default-metal-prices";
    const normalizedPrices = DEFAULT_METAL_PRICES.map((price, index) =>
      normalizeMetalPrice(price, index, updatedBy),
    );

    for (const price of normalizedPrices) {
      const existing = await ctx.db
        .query("metalPrices")
        .withIndex("by_symbol", (q) => q.eq("symbol", price.symbol))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, price);
      } else {
        await ctx.db.insert("metalPrices", price);
      }
    }

    return { upserted: normalizedPrices.length };
  },
});
