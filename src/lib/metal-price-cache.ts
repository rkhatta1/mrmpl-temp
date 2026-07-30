export const METAL_PRICE_CACHE_KEY = "mrmpl:metal-prices:v1";
export const METAL_PRICE_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type CachedMetalPrice = {
  _id: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  currency: string;
  sortOrder: number;
  updatedAt: number;
};

type MetalPriceCacheStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

type MetalPriceCacheEntry = {
  cachedAt: number;
  prices: CachedMetalPrice[];
};

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isCachedMetalPrice(value: unknown): value is CachedMetalPrice {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const price = value as Record<string, unknown>;

  return (
    typeof price._id === "string" &&
    typeof price.name === "string" &&
    typeof price.symbol === "string" &&
    isFiniteNumber(price.price) &&
    isFiniteNumber(price.change) &&
    isFiniteNumber(price.changePercent) &&
    typeof price.unit === "string" &&
    typeof price.currency === "string" &&
    isFiniteNumber(price.sortOrder) &&
    isFiniteNumber(price.updatedAt)
  );
}

export function readMetalPriceCache(
  storage: MetalPriceCacheStorage | null = getBrowserStorage(),
  now = Date.now(),
) {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(METAL_PRICE_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const entry = JSON.parse(raw) as Partial<MetalPriceCacheEntry>;
    const valid =
      isFiniteNumber(entry.cachedAt) &&
      now - entry.cachedAt <= METAL_PRICE_CACHE_MAX_AGE_MS &&
      Array.isArray(entry.prices) &&
      entry.prices.length <= 6 &&
      entry.prices.every(isCachedMetalPrice);

    if (!valid) {
      invalidateMetalPriceCache(storage);
      return null;
    }

    return entry.prices;
  } catch {
    invalidateMetalPriceCache(storage);
    return null;
  }
}

export function writeMetalPriceCache(
  prices: CachedMetalPrice[],
  storage: MetalPriceCacheStorage | null = getBrowserStorage(),
  cachedAt = Date.now(),
) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      METAL_PRICE_CACHE_KEY,
      JSON.stringify({ cachedAt, prices } satisfies MetalPriceCacheEntry),
    );
  } catch {
    // Cache failures must never block the live Convex data path.
  }
}

export function invalidateMetalPriceCache(
  storage: MetalPriceCacheStorage | null = getBrowserStorage(),
) {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(METAL_PRICE_CACHE_KEY);
  } catch {
    // Cache invalidation is best-effort; Convex remains the source of truth.
  }
}
