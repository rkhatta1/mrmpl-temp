import { NextResponse } from "next/server";
import { listLocalProducts } from "@/lib/product-data";
import {
  api,
  getConvexHttpClient,
  toPublicProducts,
} from "@/lib/convex-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const search = searchParams.get("search") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const subCategoryId = searchParams.get("subCategoryId") || undefined;
  const includeInactive = searchParams.get("includeInactive") === "true";

  const convex = getConvexHttpClient();
  if (convex) {
    try {
      const result = await convex.query(api.products.list, {
        page,
        limit,
        search,
        categoryId,
        subCategoryId,
        includeInactive,
      });

      return NextResponse.json({
        success: true,
        data: toPublicProducts(result.data),
        pagination: result.pagination,
        source: "convex",
      });
    } catch (error) {
      console.warn("Convex products query failed, falling back to local product data.", error);
    }
  }

  const { data, pagination } = listLocalProducts(searchParams);

  return NextResponse.json({
    success: true,
    data,
    pagination,
    source: "local",
  });
}
