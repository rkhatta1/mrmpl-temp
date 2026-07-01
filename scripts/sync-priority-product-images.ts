import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import products from "../src/data/products.json";

const ROOT_DIR = process.cwd();
const SOURCE_DIR = path.join(ROOT_DIR, "public", "optimized", "products");
const TARGET_DIR = path.join(ROOT_DIR, "public", "optimized", "priority-products");
const PART_CODES_PATH = path.join(ROOT_DIR, "src", "data", "priority-product-part-codes.json");
const PRIORITY_PRODUCT_COUNT = 200;

function compareStringsAsc(a: unknown, b: unknown) {
  return String(a || "").localeCompare(String(b || ""), undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

async function main() {
  const priorityProducts = products
    .filter((product) => product.isActive !== false)
    .sort((a, b) => compareStringsAsc(a.partCode, b.partCode))
    .slice(0, PRIORITY_PRODUCT_COUNT);

  const partCodes = priorityProducts.map((product) => product.partCode.toLowerCase());
  const missing: string[] = [];

  await rm(TARGET_DIR, { recursive: true, force: true });
  await mkdir(TARGET_DIR, { recursive: true });

  for (const partCode of partCodes) {
    const source = path.join(SOURCE_DIR, partCode);
    const target = path.join(TARGET_DIR, partCode);

    try {
      await readdir(source);
      await cp(source, target, { recursive: true });
    } catch {
      missing.push(partCode);
    }
  }

  await writeFile(PART_CODES_PATH, `${JSON.stringify(partCodes, null, 2)}\n`);

  console.log(`Priority products: ${partCodes.length}`);
  console.log(`First part code: ${partCodes[0]}`);
  console.log(`Last part code: ${partCodes.at(-1)}`);
  console.log(`Missing source folders: ${missing.length}`);

  if (missing.length > 0) {
    console.log(missing.join("\n"));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
