import { afterEach, describe, expect, test } from "bun:test";

import { GET } from "./route";

const originalFetch = globalThis.fetch;
const originalCurrencyApiKey = process.env.CURRENCY_EX_KEY;

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.CURRENCY_EX_KEY = originalCurrencyApiKey;
});

describe("/api/currency/rates", () => {
  test("returns normalized INR rates for the homepage currency cards", async () => {
    const requestedUrls: string[] = [];
    const requestedApiKeys: string[] = [];
    process.env.CURRENCY_EX_KEY = "test-currency-api-key";

    const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requestedUrls.push(url);
      requestedApiKeys.push(String((init?.headers as Record<string, string>)?.apikey));
      const base = new URL(url).searchParams.get("base_currency");
      const rates = {
        USD: 83.12,
        EUR: 91.34,
        CAD: 61.56,
      };

      return new Response(
        JSON.stringify({
          meta: { last_updated_at: "2026-07-01T10:15:59Z" },
          data: {
            INR: {
              code: "INR",
              value: rates[base as keyof typeof rates],
            },
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    };

    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.source).toBe("currencyapi");
    expect(body.data.currencyRates).toEqual([
      { fromCurrency: "USD", toCurrency: "INR", rate: 83.12, date: "2026-07-01T10:15:59Z" },
      { fromCurrency: "EUR", toCurrency: "INR", rate: 91.34, date: "2026-07-01T10:15:59Z" },
      { fromCurrency: "CAD", toCurrency: "INR", rate: 61.56, date: "2026-07-01T10:15:59Z" },
    ]);
    expect(requestedUrls).toEqual([
      "https://api.currencyapi.com/v3/latest?base_currency=USD&currencies=INR",
      "https://api.currencyapi.com/v3/latest?base_currency=EUR&currencies=INR",
      "https://api.currencyapi.com/v3/latest?base_currency=CAD&currencies=INR",
    ]);
    expect(requestedApiKeys).toEqual([
      "test-currency-api-key",
      "test-currency-api-key",
      "test-currency-api-key",
    ]);
  });
});
