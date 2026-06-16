import { NextResponse } from "next/server";
import { findLocalProductByPartCode } from "@/lib/product-data";
import {
  api,
  getConvexHttpClient,
  toPublicProduct,
} from "@/lib/convex-server";

export async function GET(_request: Request, context: { params: Promise<{ partCode: string }> }) {
  const { partCode } = await context.params;
  const decodedPartCode = decodeURIComponent(partCode);
  const convex = getConvexHttpClient();

  if (convex) {
    try {
      const product = await convex.query(api.products.byPartCode, { partCode: decodedPartCode });
      if (product) {
        return NextResponse.json({
          success: true,
          data: toPublicProduct(product),
          source: "convex",
        });
      }
    } catch (error) {
      console.warn("Convex part-code lookup failed, falling back to local product data.", error);
    }
  }

  const product = findLocalProductByPartCode(decodedPartCode);

  if (!product) {
    return NextResponse.json(
      {
        success: false,
        message: "Product not found with the given part code",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: product,
    source: "local",
  });
}
