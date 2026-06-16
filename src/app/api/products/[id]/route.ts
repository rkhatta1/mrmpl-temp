import { NextResponse } from "next/server";
import {
  findLocalProductById,
  getRelatedLocalProducts,
} from "@/lib/product-data";
import {
  api,
  getConvexHttpClient,
  toPublicProduct,
  toPublicProducts,
} from "@/lib/convex-server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const convex = getConvexHttpClient();

  if (convex) {
    try {
      const product = await convex.query(api.products.get, { id });
      if (product) {
        const relatedProducts = await convex.query(api.products.related, { id, count: 3 });
        return NextResponse.json({
          success: true,
          data: toPublicProduct(product),
          relatedProducts: toPublicProducts(relatedProducts),
          source: "convex",
        });
      }
    } catch (error) {
      console.warn("Convex product lookup failed, falling back to local product data.", error);
    }
  }

  const product = findLocalProductById(id);

  if (!product) {
    return NextResponse.json(
      {
        success: false,
        message: "Product not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: product,
    relatedProducts: getRelatedLocalProducts(product),
    source: "local",
  });
}
