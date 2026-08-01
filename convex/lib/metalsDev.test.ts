import { describe, expect, test } from "bun:test";

import {
  calculateMetalPriceChange,
  getMetalRequestDecision,
  parseMetalsDevLatest,
  needsMetalPriceSync,
} from "./metalsDev";

describe("metals.dev latest response", () => {
  test("normalizes the distinct spot-metal catalogue and metric-tonne prices", () => {
    const snapshot = parseMetalsDevLatest(
      {
        status: "success",
        currency: "USD",
        unit: "mt",
        timestamp: "2026-07-30T06:30:00.000Z",
        metals: {
          gold: 110,
          silver: 120,
          platinum: 130,
          palladium: 140,
          aluminum: 150,
          copper: 160,
          lead: 170,
          nickel: 180,
          zinc: 190,
          lme_copper: 999,
        },
      },
      Date.parse("2026-07-30T07:00:00.000Z"),
    );

    expect(snapshot).toEqual({
      currency: "USD",
      unit: "mt",
      sourceTimestamp: Date.parse("2026-07-30T06:30:00.000Z"),
      metals: [
        { apiCode: "gold", name: "Gold", symbol: "AU", price: 110 },
        { apiCode: "silver", name: "Silver", symbol: "AG", price: 120 },
        { apiCode: "platinum", name: "Platinum", symbol: "PT", price: 130 },
        { apiCode: "palladium", name: "Palladium", symbol: "PD", price: 140 },
        { apiCode: "aluminum", name: "Aluminum", symbol: "AL", price: 150 },
        { apiCode: "copper", name: "Copper", symbol: "CU", price: 160 },
        { apiCode: "lead", name: "Lead", symbol: "PB", price: 170 },
        { apiCode: "nickel", name: "Nickel", symbol: "NI", price: 180 },
        { apiCode: "zinc", name: "Zinc", symbol: "ZN", price: 190 },
      ],
    });
  });
});

describe("metals.dev request budget", () => {
  test("allows at most one request per UTC day and respects the monthly quota", () => {
    const now = Date.parse("2026-07-30T07:00:00.000Z");

    expect(
      getMetalRequestDecision({
        now,
        lastAttemptDay: "2026-07-30",
        monthlyCount: 1,
      }),
    ).toEqual({
      allowed: false,
      reason: "already-requested-today",
      dayKey: "2026-07-30",
      monthKey: "2026-07",
    });

    expect(
      getMetalRequestDecision({
        now,
        lastAttemptDay: "2026-07-29",
        monthlyCount: 100,
      }),
    ).toEqual({
      allowed: false,
      reason: "monthly-quota-reached",
      dayKey: "2026-07-30",
      monthKey: "2026-07",
    });

    expect(
      getMetalRequestDecision({
        now,
        lastAttemptDay: "2026-07-29",
        monthlyCount: 99,
      }),
    ).toEqual({
      allowed: true,
      dayKey: "2026-07-30",
      monthKey: "2026-07",
    });
  });
});

describe("stored daily price changes", () => {
  test("uses zero for the first API price and rounds later percentages", () => {
    expect(calculateMetalPriceChange(undefined, 3)).toEqual({
      change: 0,
      changePercent: 0,
    });
    expect(calculateMetalPriceChange(3, 4)).toEqual({
      change: 1,
      changePercent: 33.33,
    });
  });
});

describe("metals.dev missing-price fallback", () => {
  test("requests a manual sync only when Convex market rows are incomplete", () => {
    const completeCatalogue = [
      "gold",
      "silver",
      "platinum",
      "palladium",
      "aluminum",
      "copper",
      "lead",
      "nickel",
      "zinc",
    ];

    expect(needsMetalPriceSync(completeCatalogue)).toBe(false);
    expect(
      needsMetalPriceSync(completeCatalogue.filter((code) => code !== "zinc")),
    ).toBe(true);
  });
});
