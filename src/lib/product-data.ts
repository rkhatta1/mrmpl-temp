import products from "@/data/products.json";

export type ProductRecord = (typeof products)[number];

function normalize(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function matchesField(value: unknown, expected: string | null) {
  if (!expected) return true;
  return normalize(value) === normalize(expected);
}

export function getAllLocalProducts() {
  return products as ProductRecord[];
}

export function findLocalProductById(id: string) {
  return getAllLocalProducts().find((product) => product._id === id || product.id === id);
}

export function findLocalProductByPartCode(partCode: string) {
  return getAllLocalProducts().find((product) => normalize(product.partCode) === normalize(partCode));
}

export function listLocalProducts(searchParams: URLSearchParams) {
  const includeInactive = searchParams.get("includeInactive") === "true";
  const categoryId = searchParams.get("categoryId");
  const subCategoryId = searchParams.get("subCategoryId");
  const search = normalize(searchParams.get("search"));
  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const limit = Math.max(Number(searchParams.get("limit") || 10), 1);

  let filtered = getAllLocalProducts().filter((product) => includeInactive || product.isActive !== false);

  filtered = filtered.filter((product) => {
    const categoryMatches =
      matchesField(product.category?._id, categoryId) || matchesField(product.category?.name, categoryId);
    const subcategoryMatches =
      matchesField(product.subCategory?._id, subCategoryId) || matchesField(product.subCategory?.name, subCategoryId);

    if (!categoryMatches || !subcategoryMatches) return false;
    if (!search) return true;

    return [
      product.productName,
      product.partCode,
      product.material,
      product.type,
      product.description,
    ].some((value) => normalize(value).includes(search));
  });

  if (includeInactive || limit >= 10000) {
    return {
      data: filtered,
      pagination: {
        current: page,
        pages: 1,
        total: filtered.length,
      },
    };
  }

  const start = (page - 1) * limit;
  const pageData = filtered.slice(start, start + limit);

  return {
    data: pageData,
    pagination: {
      current: page,
      pages: Math.ceil(filtered.length / limit),
      total: filtered.length,
    },
  };
}

export function getRelatedLocalProducts(product: ProductRecord, count = 3) {
  const allProducts = getAllLocalProducts().filter(
    (candidate) => candidate._id !== product._id && candidate.isActive !== false,
  );

  const sameSubcategory = allProducts.filter(
    (candidate) => candidate.subCategory?.name === product.subCategory?.name,
  );
  const sameCategory = allProducts.filter(
    (candidate) =>
      candidate.category?.name === product.category?.name &&
      candidate.subCategory?.name !== product.subCategory?.name,
  );

  return [...sameSubcategory, ...sameCategory].slice(0, count);
}
