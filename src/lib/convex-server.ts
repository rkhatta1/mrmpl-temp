import { ConvexHttpClient } from "convex/browser";

import { api } from "../../convex/_generated/api";

export { api };

export function getConvexHttpClient() {
  const url = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

type ConvexProductLike = Record<string, unknown> & {
  _id?: unknown;
  id?: unknown;
  externalId?: unknown;
};

export function toPublicProduct(product: ConvexProductLike | null | undefined) {
  if (!product) return product;

  return {
    ...product,
    _id: product.externalId || product._id,
    id: product.externalId || product.id || product._id,
  };
}

export function toPublicProducts(products: ConvexProductLike[]) {
  return products.map(toPublicProduct);
}
