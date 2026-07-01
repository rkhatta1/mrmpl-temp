import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

type NamedRef = {
  _id?: unknown;
  name?: unknown;
};

type ProductRecord = Record<string, unknown> & {
  _id?: unknown;
  id?: unknown;
  productName?: unknown;
  partCode?: unknown;
  category?: NamedRef;
  subCategory?: NamedRef;
  size?: unknown;
  material?: unknown;
  type?: unknown;
  finishPlating?: unknown;
  threadStandard?: unknown;
  sealant?: unknown;
  temperature?: unknown;
  pressure?: unknown;
  connections?: unknown;
  assemblies?: unknown;
  grade?: unknown;
  description?: unknown;
  applications?: unknown;
  certifications?: unknown;
  additionalNotes?: unknown;
  dimensions?: unknown;
  images?: unknown;
  isActive?: unknown;
  createdAt?: unknown;
};

const ROOT_DIR = process.cwd();
const OLD_BACKEND_DIR =
  process.env.OLD_MRMPL_BACKEND_DIR ?? path.resolve(ROOT_DIR, "..", "old", "raw-mint-backend");
const OLD_ENV_PATH = path.join(OLD_BACKEND_DIR, ".env");
const PRODUCTS_PATH = path.join(ROOT_DIR, "src", "data", "products.json");
const DEFAULT_EXPORT_PATH = path.join(ROOT_DIR, ".migration", "old-products-export.json");

const RICH_FIELDS = [
  "type",
  "finishPlating",
  "threadStandard",
  "sealant",
  "temperature",
  "pressure",
  "connections",
  "assemblies",
  "grade",
  "description",
  "applications",
  "certifications",
  "additionalNotes",
  "dimensions",
] as const;

function parseEnvFile(raw: string) {
  return raw.split(/\r?\n/).reduce<Record<string, string>>((env, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return env;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return env;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
    return env;
  }, {});
}

function normalizeKey(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toIsoString(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toObjectIdString(value: unknown) {
  if (!value) return "";
  if (isRecord(value) && "toString" in value) return String(value);
  return String(value);
}

function normalizeNamedRef(value: unknown, fallback?: unknown) {
  if (isRecord(fallback) && fallback._id && fallback.name) {
    return {
      _id: cleanString(fallback._id),
      name: cleanString(fallback.name),
    };
  }

  if (isRecord(value)) {
    const record = value;
    const name = cleanString(record.name);
    if (name) return { _id: name, name };
    const id = toObjectIdString(record._id);
    if (id) return { _id: id, name: id };
  }

  const label = cleanString(value);
  return label ? { _id: label, name: label } : { _id: "Uncategorized", name: "Uncategorized" };
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(cleanString).filter(Boolean);
  }
  const stringValue = cleanString(value);
  if (!stringValue) return [];
  return stringValue
    .split(";")
    .map(cleanString)
    .filter(Boolean);
}

function normalizeDimensions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((dimension) => ({
      parameter: cleanString(dimension.parameter),
      value: cleanString(dimension.value),
      notes: cleanString(dimension.notes),
    }))
    .filter((dimension) => dimension.parameter && dimension.value);
}

function normalizeImages(value: unknown) {
  return normalizeStringArray(value);
}

function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return cleanString(value).length > 0;
}

function mergeProduct(existing: ProductRecord | undefined, oldProduct: ProductRecord) {
  const oldId = toObjectIdString(oldProduct._id);
  const existingImages = Array.isArray(existing?.images) ? existing.images.filter(Boolean) : [];
  const oldImages = normalizeImages(oldProduct.images);

  return {
    ...(existing ?? {}),
    _id: oldId || existing?._id,
    id: oldId || existing?.id || existing?._id,
    productName: cleanString(oldProduct.productName) || existing?.productName || "",
    partCode: cleanString(oldProduct.partCode) || existing?.partCode || "",
    category: normalizeNamedRef(oldProduct.category, existing?.category),
    subCategory: normalizeNamedRef(oldProduct.subCategory, existing?.subCategory),
    size: cleanString(oldProduct.size) || existing?.size || "",
    material: cleanString(oldProduct.material) || existing?.material || "",
    type: cleanString(oldProduct.type),
    finishPlating: cleanString(oldProduct.finishPlating),
    threadStandard: cleanString(oldProduct.threadStandard),
    sealant: cleanString(oldProduct.sealant),
    temperature: cleanString(oldProduct.temperature) || existing?.temperature || "",
    pressure: cleanString(oldProduct.pressure),
    connections: cleanString(oldProduct.connections),
    assemblies: cleanString(oldProduct.assemblies),
    grade: cleanString(oldProduct.grade) || existing?.grade || "",
    description: cleanString(oldProduct.description) || existing?.description || "",
    applications: normalizeStringArray(oldProduct.applications),
    certifications: normalizeStringArray(oldProduct.certifications),
    additionalNotes: normalizeStringArray(oldProduct.additionalNotes),
    dimensions: normalizeDimensions(oldProduct.dimensions),
    images: existingImages.length > 0 ? existingImages : oldImages,
    isActive: oldProduct.isActive ?? existing?.isActive ?? true,
    createdAt: existing?.createdAt ?? toIsoString(oldProduct.createdAt),
  };
}

async function loadOldProducts(): Promise<ProductRecord[]> {
  const env = {
    ...parseEnvFile(await readFile(OLD_ENV_PATH, "utf8")),
    ...process.env,
  };
  const mongoUri = env.OLD_MONGO_URI || env.MONGO_URI;
  if (!mongoUri) {
    throw new Error(`MONGO_URI was not found in ${OLD_ENV_PATH}.`);
  }

  const oldNodeModules = path.join(OLD_BACKEND_DIR, "node_modules");
  const mongooseModule = await import(pathToFileURL(path.join(oldNodeModules, "mongoose", "index.js")).href);
  const mongoose = mongooseModule.default ?? mongooseModule;

  await import(pathToFileURL(path.join(OLD_BACKEND_DIR, "src", "db", "category.model.js")).href);
  await import(pathToFileURL(path.join(OLD_BACKEND_DIR, "src", "db", "subcategory.model.js")).href);
  const { Product } = await import(pathToFileURL(path.join(OLD_BACKEND_DIR, "src", "db", "product.model.js")).href);

  await mongoose.connect(mongoUri);
  try {
    const products = await Product.find({})
      .select(
        "productName partCode size material type finishPlating threadStandard sealant temperature pressure connections assemblies grade description applications certifications additionalNotes dimensions images isActive category subCategory createdAt",
      )
      .populate("category", "name")
      .populate("subCategory", "name")
      .sort({ partCode: 1 })
      .lean();
    return products as ProductRecord[];
  } finally {
    await mongoose.disconnect();
  }
}

async function main() {
  const oldProducts = await loadOldProducts();
  const currentProducts = JSON.parse(await readFile(PRODUCTS_PATH, "utf8")) as ProductRecord[];
  const oldByPartCode = new Map<string, ProductRecord>(
    oldProducts.map((product) => [normalizeKey(product.partCode), product]),
  );
  const seenPartCodes = new Set<string>();

  const mergedProducts: ProductRecord[] = currentProducts.map((product) => {
    const key = normalizeKey(product.partCode);
    seenPartCodes.add(key);
    const oldProduct = oldByPartCode.get(key);
    return oldProduct ? mergeProduct(product, oldProduct) : product;
  });

  const missingProducts: ProductRecord[] = oldProducts
    .filter((product) => !seenPartCodes.has(normalizeKey(product.partCode)))
    .map((product) => mergeProduct(undefined, product));

  mergedProducts.push(...missingProducts);

  const recoverableCounts = Object.fromEntries(RICH_FIELDS.map((field) => [field, 0]));
  for (const product of mergedProducts) {
    for (const field of RICH_FIELDS) {
      if (hasValue(product[field])) recoverableCounts[field] += 1;
    }
  }

  const exportPath = process.env.OLD_PRODUCTS_EXPORT_PATH || DEFAULT_EXPORT_PATH;
  await mkdir(path.dirname(exportPath), { recursive: true });
  await writeFile(exportPath, `${JSON.stringify(oldProducts, null, 2)}\n`);
  await writeFile(PRODUCTS_PATH, `${JSON.stringify(mergedProducts, null, 2)}\n`);

  console.log(`Old products exported: ${oldProducts.length}`);
  console.log(`Current products before merge: ${currentProducts.length}`);
  console.log(`Products after merge: ${mergedProducts.length}`);
  console.log(`Products added from old Mongo: ${missingProducts.length}`);
  console.log(`Old export path: ${path.relative(ROOT_DIR, exportPath)}`);
  console.log("Filled field counts:");
  console.log(JSON.stringify(recoverableCounts, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
