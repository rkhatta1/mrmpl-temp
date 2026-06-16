import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      metalPrices: [
        { name: "Brass", symbol: "BR", price: 0, change: 0, changePercent: 0, unit: "per ton" },
        { name: "Copper", symbol: "CU", price: 0, change: 0, changePercent: 0, unit: "per ton" },
        { name: "Zinc", symbol: "ZN", price: 0, change: 0, changePercent: 0, unit: "per ton" },
      ],
      currencyRates: [
        { fromCurrency: "USD", toCurrency: "INR", rate: 0 },
        { fromCurrency: "EUR", toCurrency: "INR", rate: 0 },
        { fromCurrency: "CAD", toCurrency: "INR", rate: 0 },
      ],
    },
  });
}
