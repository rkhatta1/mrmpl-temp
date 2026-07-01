import { NextResponse } from "next/server";

const CURRENCY_API_BASE = "https://api.currencyapi.com/v3";
const TARGET_CURRENCY = "INR";
const SOURCE_CURRENCIES = ["USD", "EUR", "CAD"] as const;
const CACHE_SECONDS = 8 * 60 * 60;

export const revalidate = 28800;

type SourceCurrency = (typeof SOURCE_CURRENCIES)[number];

type CurrencyApiRateResponse = {
  meta?: {
    last_updated_at?: string;
  };
  data?: Record<string, { code?: string; value?: number }>;
};

async function fetchCurrencyRate(fromCurrency: SourceCurrency) {
  const apiKey = process.env.CURRENCY_EX_KEY;
  if (!apiKey) {
    throw new Error("Missing CURRENCY_EX_KEY");
  }

  const url = `${CURRENCY_API_BASE}/latest?base_currency=${fromCurrency}&currencies=${TARGET_CURRENCY}`;
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      apikey: apiKey,
    },
    next: { revalidate: CACHE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`CurrencyAPI ${fromCurrency}/${TARGET_CURRENCY} request failed: ${response.status}`);
  }

  const payload = (await response.json()) as CurrencyApiRateResponse;
  const rate = payload.data?.[TARGET_CURRENCY]?.value;

  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    throw new Error(`CurrencyAPI ${fromCurrency}/${TARGET_CURRENCY} response did not include a numeric rate`);
  }

  return {
    fromCurrency,
    toCurrency: TARGET_CURRENCY,
    rate,
    date: payload.meta?.last_updated_at,
  };
}

export async function GET() {
  try {
    const currencyRates = await Promise.all(SOURCE_CURRENCIES.map(fetchCurrencyRate));

    return NextResponse.json({
      success: true,
      data: {
        currencyRates,
        updatedAt: new Date().toISOString(),
        source: "currencyapi",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to fetch currency rates",
      },
      { status: 502 },
    );
  }
}
