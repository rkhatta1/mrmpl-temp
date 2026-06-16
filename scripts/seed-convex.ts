import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";
import products from "../src/data/products.json";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_SUBCATEGORIES,
} from "../src/data/product-taxonomy";

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
const BATCH_SIZE = Number(process.env.CONVEX_SEED_BATCH_SIZE || 100);

if (!CONVEX_URL) {
  throw new Error("CONVEX_URL or NEXT_PUBLIC_CONVEX_URL is required to seed Convex.");
}

const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  console.log(`Seeding Convex at ${CONVEX_URL}`);

  const taxonomyResult = await client.mutation(api.categories.seed, {
    categories: [...PRODUCT_CATEGORIES],
    subcategories: [...PRODUCT_SUBCATEGORIES],
  });
  console.log(
    `Seeded ${taxonomyResult.categories} categories and ${taxonomyResult.subcategories} subcategories.`,
  );

  let upserted = 0;
  for (let start = 0; start < products.length; start += BATCH_SIZE) {
    const batch = products.slice(start, start + BATCH_SIZE);
    const result = await client.mutation(api.products.seedBatch, { products: batch });
    upserted += result.upserted;
    console.log(`Seeded products ${start + 1}-${start + batch.length} of ${products.length}.`);
  }

  console.log(`Seed complete. Upserted ${upserted} products.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
