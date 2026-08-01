import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
  type ActionCtx,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import {
  calculateMetalPriceChange,
  getMetalRequestDecision,
  METALS_DEV_MONTHLY_LIMIT,
  needsMetalPriceSync,
  parseMetalsDevLatest,
  SELECTABLE_METALS,
  type MetalRequestDecision,
  type MetalsDevSnapshot,
} from "./lib/metalsDev";

const PROVIDER = "metals.dev";
const SYNC_KEY = "daily-prices";
const SELECTABLE_METAL_COUNT = 9;
const MAX_HOMEPAGE_METALS = 6;

type SyncResult =
  | {
      synced: true;
      metalCount: number;
      sourceTimestamp: number;
    }
  | {
      synced: false;
      reason: string;
    };

const snapshotMetal = v.object({
  apiCode: v.string(),
  name: v.string(),
  symbol: v.string(),
  price: v.number(),
});

const syncResult = v.union(
  v.object({
    synced: v.literal(true),
    metalCount: v.number(),
    sourceTimestamp: v.number(),
  }),
  v.object({
    synced: v.literal(false),
    reason: v.string(),
  }),
);

async function requireAdminIdentity(ctx: ActionCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("You must be signed in to manage metal prices.");
  }

  return identity;
}

function normalizedKey(value: string) {
  return value.trim().toLocaleLowerCase("en");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The metals.dev request failed.";
}

export const getAdminData = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx);

    const [prices, marketPrices, state, usage] = await Promise.all([
      ctx.db
        .query("metalPrices")
        .withIndex("by_sort_order")
        .take(MAX_HOMEPAGE_METALS),
      ctx.db
        .query("metalMarketPrices")
        .withIndex("by_api_code")
        .take(SELECTABLE_METAL_COUNT),
      ctx.db
        .query("metalApiSyncState")
        .withIndex("by_key", (q) => q.eq("key", SYNC_KEY))
        .unique(),
      ctx.db
        .query("metalApiUsage")
        .withIndex("by_provider_and_month", (q) =>
          q.eq("provider", PROVIDER).eq("month", args.month),
        )
        .unique(),
    ]);

    const marketByCode = new Map(
      marketPrices.map((market) => [market.apiCode, market]),
    );

    return {
      prices: prices.map((price) => ({
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
      })),
      catalogue: SELECTABLE_METALS.map((metal) => {
        const market = marketByCode.get(metal.apiCode);
        return {
          apiCode: metal.apiCode,
          name: metal.name,
          symbol: metal.symbol,
          price: market?.price ?? null,
          currency: market?.currency ?? "USD",
          unit: market?.unit ?? "per metric tonne",
          updatedAt: market?.updatedAt ?? null,
        };
      }),
      usage: {
        month: args.month,
        count: usage?.count ?? 0,
        limit: usage?.limit ?? METALS_DEV_MONTHLY_LIMIT,
        remaining: Math.max(
          0,
          (usage?.limit ?? METALS_DEV_MONTHLY_LIMIT) - (usage?.count ?? 0),
        ),
        totalRequests: state?.totalRequests ?? 0,
        status: state?.status ?? "idle",
        lastAttemptAt: state?.lastAttemptAt ?? null,
        lastSuccessAt: state?.lastSuccessAt ?? null,
        sourceTimestamp: state?.sourceTimestamp ?? null,
        error: state?.error ?? null,
      },
    };
  },
});

export const isMarketPriceSyncNeeded = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const marketPrices = await ctx.db
      .query("metalMarketPrices")
      .withIndex("by_api_code")
      .take(SELECTABLE_METAL_COUNT);

    return needsMetalPriceSync(marketPrices.map((market) => market.apiCode));
  },
});

export const reserveRequest = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const state = await ctx.db
      .query("metalApiSyncState")
      .withIndex("by_key", (q) => q.eq("key", SYNC_KEY))
      .unique();
    const monthKey = new Date(now).toISOString().slice(0, 7);
    const usage = await ctx.db
      .query("metalApiUsage")
      .withIndex("by_provider_and_month", (q) =>
        q.eq("provider", PROVIDER).eq("month", monthKey),
      )
      .unique();
    const decision = getMetalRequestDecision({
      now,
      lastAttemptDay: state?.lastAttemptDay,
      monthlyCount: usage?.count ?? 0,
    });

    if (!decision.allowed) {
      return decision;
    }

    if (usage) {
      await ctx.db.patch(usage._id, {
        count: usage.count + 1,
        lastRequestedAt: now,
      });
    } else {
      await ctx.db.insert("metalApiUsage", {
        provider: PROVIDER,
        month: decision.monthKey,
        count: 1,
        limit: METALS_DEV_MONTHLY_LIMIT,
        lastRequestedAt: now,
      });
    }

    if (state) {
      await ctx.db.patch(state._id, {
        status: "syncing",
        totalRequests: state.totalRequests + 1,
        lastAttemptDay: decision.dayKey,
        lastAttemptAt: now,
        error: undefined,
      });
    } else {
      await ctx.db.insert("metalApiSyncState", {
        key: SYNC_KEY,
        status: "syncing",
        totalRequests: 1,
        lastAttemptDay: decision.dayKey,
        lastAttemptAt: now,
      });
    }

    return decision;
  },
});

async function applySnapshot(
  ctx: MutationCtx,
  snapshot: MetalsDevSnapshot,
  completedAt: number,
) {
  const [marketPrices, selectedPrices, state] = await Promise.all([
    ctx.db
      .query("metalMarketPrices")
      .withIndex("by_api_code")
      .take(SELECTABLE_METAL_COUNT + 1),
    ctx.db
      .query("metalPrices")
      .withIndex("by_sort_order")
      .take(MAX_HOMEPAGE_METALS + 1),
    ctx.db
      .query("metalApiSyncState")
      .withIndex("by_key", (q) => q.eq("key", SYNC_KEY))
      .unique(),
  ]);

  if (
    marketPrices.length > SELECTABLE_METAL_COUNT ||
    selectedPrices.length > MAX_HOMEPAGE_METALS
  ) {
    throw new Error("Metal-price storage exceeded its bounded size.");
  }

  const marketByCode = new Map(
    marketPrices.map((market) => [market.apiCode, market]),
  );

  for (const metal of snapshot.metals) {
    const previousMarket = marketByCode.get(metal.apiCode);
    const marketChange = calculateMetalPriceChange(
      previousMarket?.price,
      metal.price,
    );
    const marketDocument = {
      apiCode: metal.apiCode,
      price: metal.price,
      ...marketChange,
      currency: snapshot.currency,
      unit: "per metric tonne",
      sourceTimestamp: snapshot.sourceTimestamp,
      updatedAt: completedAt,
    };

    if (previousMarket) {
      await ctx.db.patch(previousMarket._id, marketDocument);
    } else {
      await ctx.db.insert("metalMarketPrices", marketDocument);
    }

    const selected = selectedPrices.find(
      (price) =>
        price.apiCode === metal.apiCode ||
        (price.apiCode === undefined &&
          (normalizedKey(price.name) === normalizedKey(metal.name) ||
            price.symbol.toLocaleUpperCase("en") === metal.symbol)),
    );

    if (selected) {
      const selectedChange = calculateMetalPriceChange(
        selected.sourceTimestamp === undefined ? undefined : selected.price,
        metal.price,
      );
      await ctx.db.patch(selected._id, {
        apiCode: metal.apiCode,
        name: metal.name,
        symbol: metal.symbol,
        price: metal.price,
        ...selectedChange,
        currency: snapshot.currency,
        unit: "per metric tonne",
        sourceTimestamp: snapshot.sourceTimestamp,
        updatedAt: completedAt,
        updatedBy: PROVIDER,
      });
    }
  }

  if (!state) {
    throw new Error("The metal API request reservation is missing.");
  }

  await ctx.db.patch(state._id, {
    status: "success",
    lastSuccessAt: completedAt,
    sourceTimestamp: snapshot.sourceTimestamp,
    error: undefined,
  });
}

export const persistSnapshot = internalMutation({
  args: {
    currency: v.literal("USD"),
    unit: v.literal("mt"),
    sourceTimestamp: v.number(),
    metals: v.array(snapshotMetal),
  },
  handler: async (ctx, args) => {
    await applySnapshot(ctx, args as MetalsDevSnapshot, Date.now());
  },
});

export const recordFailure = internalMutation({
  args: { message: v.string() },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("metalApiSyncState")
      .withIndex("by_key", (q) => q.eq("key", SYNC_KEY))
      .unique();

    if (state) {
      await ctx.db.patch(state._id, {
        status: "error",
        error: args.message.slice(0, 500),
      });
    }
  },
});

async function syncMetals(ctx: ActionCtx): Promise<SyncResult> {
  const apiKey = process.env.METALS_API_KEY;
  if (!apiKey) {
    throw new ConvexError("METALS_API_KEY is not configured on Convex.");
  }

  const reservation: MetalRequestDecision = await ctx.runMutation(
    internal.metalsApi.reserveRequest,
    {},
  );
  if (!reservation.allowed) {
    return { synced: false as const, reason: reservation.reason };
  }

  try {
    const url = new URL("https://api.metals.dev/v1/latest");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("currency", "USD");
    url.searchParams.set("unit", "mt");

    const response = await fetch(url);
    const payload: unknown = await response.json();
    if (!response.ok) {
      throw new Error(`metals.dev returned HTTP ${response.status}.`);
    }

    const snapshot = parseMetalsDevLatest(payload, Date.now());
    await ctx.runMutation(internal.metalsApi.persistSnapshot, snapshot);
    return {
      synced: true as const,
      metalCount: snapshot.metals.length,
      sourceTimestamp: snapshot.sourceTimestamp,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    await ctx.runMutation(internal.metalsApi.recordFailure, { message });
    throw new ConvexError(message);
  }
}

export const syncNow = action({
  args: {},
  returns: syncResult,
  handler: async (ctx) => {
    await requireAdminIdentity(ctx);
    const syncNeeded = await ctx.runQuery(
      internal.metalsApi.isMarketPriceSyncNeeded,
      {},
    );
    if (!syncNeeded) {
      return { synced: false as const, reason: "prices-complete" };
    }

    return syncMetals(ctx);
  },
});

export const syncDaily = internalAction({
  args: {},
  returns: syncResult,
  handler: syncMetals,
});
