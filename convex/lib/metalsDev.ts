export const SELECTABLE_METALS = [
  { apiCode: "gold", name: "Gold", symbol: "AU" },
  { apiCode: "silver", name: "Silver", symbol: "AG" },
  { apiCode: "platinum", name: "Platinum", symbol: "PT" },
  { apiCode: "palladium", name: "Palladium", symbol: "PD" },
  { apiCode: "aluminum", name: "Aluminum", symbol: "AL" },
  { apiCode: "copper", name: "Copper", symbol: "CU" },
  { apiCode: "lead", name: "Lead", symbol: "PB" },
  { apiCode: "nickel", name: "Nickel", symbol: "NI" },
  { apiCode: "zinc", name: "Zinc", symbol: "ZN" },
] as const;

export function getSelectableMetal(apiCode: string) {
  return SELECTABLE_METALS.find((metal) => metal.apiCode === apiCode) ?? null;
}

export const METALS_DEV_MONTHLY_LIMIT = 100;

export type MetalRequestDecision =
  | {
      allowed: true;
      dayKey: string;
      monthKey: string;
    }
  | {
      allowed: false;
      reason: "already-requested-today" | "monthly-quota-reached";
      dayKey: string;
      monthKey: string;
    };

export type MetalsDevSnapshot = {
  currency: "USD";
  unit: "mt";
  sourceTimestamp: number;
  metals: Array<{
    apiCode: (typeof SELECTABLE_METALS)[number]["apiCode"];
    name: string;
    symbol: string;
    price: number;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getMetalRequestDecision({
  now,
  lastAttemptDay,
  monthlyCount,
}: {
  now: number;
  lastAttemptDay?: string;
  monthlyCount: number;
}): MetalRequestDecision {
  const dayKey = new Date(now).toISOString().slice(0, 10);
  const monthKey = dayKey.slice(0, 7);

  if (lastAttemptDay === dayKey) {
    return {
      allowed: false,
      reason: "already-requested-today",
      dayKey,
      monthKey,
    };
  }

  if (monthlyCount >= METALS_DEV_MONTHLY_LIMIT) {
    return {
      allowed: false,
      reason: "monthly-quota-reached",
      dayKey,
      monthKey,
    };
  }

  return { allowed: true, dayKey, monthKey };
}

export function calculateMetalPriceChange(
  previousPrice: number | undefined,
  currentPrice: number,
) {
  if (
    previousPrice === undefined ||
    !Number.isFinite(previousPrice) ||
    previousPrice <= 0
  ) {
    return { change: 0, changePercent: 0 };
  }

  const change = currentPrice - previousPrice;
  return {
    change: Number(change.toFixed(2)),
    changePercent: Number(((change / previousPrice) * 100).toFixed(2)),
  };
}

export function parseMetalsDevLatest(
  payload: unknown,
  receivedAt: number,
): MetalsDevSnapshot {
  if (!isRecord(payload) || payload.status !== "success") {
    throw new Error("metals.dev returned an unsuccessful response.");
  }

  if (payload.currency !== "USD" || payload.unit !== "mt") {
    throw new Error("metals.dev returned an unexpected currency or unit.");
  }

  const metalPrices = payload.metals;
  if (!isRecord(metalPrices)) {
    throw new Error("metals.dev did not return metal prices.");
  }

  const metals = SELECTABLE_METALS.map((metal) => {
    const price = metalPrices[metal.apiCode];
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      throw new Error(`metals.dev returned an invalid ${metal.apiCode} price.`);
    }

    return { ...metal, price };
  });

  const parsedTimestamp =
    typeof payload.timestamp === "string" ? Date.parse(payload.timestamp) : NaN;

  return {
    currency: "USD",
    unit: "mt",
    sourceTimestamp: Number.isFinite(parsedTimestamp)
      ? parsedTimestamp
      : receivedAt,
    metals,
  };
}
