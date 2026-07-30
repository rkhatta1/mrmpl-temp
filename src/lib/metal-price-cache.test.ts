import { describe, expect, test } from "bun:test";

import {
  METAL_PRICE_CACHE_MAX_AGE_MS,
  invalidateMetalPriceCache,
  readMetalPriceCache,
  writeMetalPriceCache,
} from "./metal-price-cache";

class MemoryStorage implements Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
> {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const copper = {
  _id: "metal-copper",
  name: "Copper",
  symbol: "CU",
  price: 250,
  change: -10,
  changePercent: -3.85,
  unit: "per ton",
  currency: "USD",
  sortOrder: 1,
  updatedAt: 100,
};

describe("metal price browser cache", () => {
  test("returns a recently cached public metal-price list", () => {
    const storage = new MemoryStorage();

    writeMetalPriceCache([copper], storage, 1_000);

    expect(readMetalPriceCache(storage, 1_500)).toEqual([copper]);
  });

  test("invalidates explicit and expired cache entries", () => {
    const storage = new MemoryStorage();

    writeMetalPriceCache([copper], storage, 1_000);
    expect(
      readMetalPriceCache(storage, 1_000 + METAL_PRICE_CACHE_MAX_AGE_MS + 1),
    ).toBeNull();

    writeMetalPriceCache([copper], storage, 2_000);
    invalidateMetalPriceCache(storage);
    expect(readMetalPriceCache(storage, 2_001)).toBeNull();
  });
});
