import { NextResponse } from "next/server";

import { api, getConvexHttpClient } from "@/lib/convex-server";

export async function GET() {
  const convex = getConvexHttpClient();
  if (!convex) {
    return NextResponse.json(
      {
        success: false,
        message: "Convex is not configured",
      },
      { status: 503 },
    );
  }

  try {
    const metalPrices = await convex.query(api.metalPrices.list, {});
    const updatedAt = metalPrices.reduce(
      (latest, metal) => Math.max(latest, metal.updatedAt),
      0,
    );

    return NextResponse.json({
      success: true,
      data: {
        metalPrices,
        updatedAt: updatedAt ? new Date(updatedAt).toISOString() : null,
        source: "convex",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to fetch metal prices",
      },
      { status: 502 },
    );
  }
}
