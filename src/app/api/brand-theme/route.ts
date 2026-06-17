import { NextResponse } from "next/server";

import { DEFAULT_BRAND_THEME, normalizeBrandTheme } from "@/lib/brand-theme";
import { getGlobalBrandTheme } from "@/lib/brand-theme-server";
import { api, getConvexHttpClient } from "@/lib/convex-server";

export async function GET() {
  const values = await getGlobalBrandTheme();

  return NextResponse.json({
    success: true,
    data: { values },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const values = normalizeBrandTheme(body?.values);

  const convex = getConvexHttpClient();
  if (!convex) {
    return NextResponse.json(
      {
        success: false,
        message: "Convex is not configured, so the global theme cannot be saved.",
        data: { values: DEFAULT_BRAND_THEME },
      },
      { status: 503 },
    );
  }

  try {
    const result = await convex.mutation(api.brandTheme.apply, {
      values,
      updatedBy: "brand-theme-widget",
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        values: normalizeBrandTheme(result.values),
      },
      source: "convex",
    });
  } catch (error) {
    console.error("Convex brand theme apply failed.", error);
    return NextResponse.json(
      {
        success: false,
        message: "Could not apply the global brand theme.",
      },
      { status: 500 },
    );
  }
}
