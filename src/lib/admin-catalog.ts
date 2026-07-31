export type CatalogCategorySummary = {
  externalId: string;
  name: string;
  description: string;
};

export type CatalogSubcategorySummary = {
  externalId: string;
  name: string;
  categoryExternalId: string;
};

export type CatalogProductSummary = {
  externalId: string;
  productName: string;
  partCode: string;
  categoryExternalId: string;
  subcategoryExternalId: string;
  isActive: boolean;
};

export type CatalogTreeElement = {
  id: string;
  name: string;
  type: "file" | "folder";
  nodeType: "category" | "subcategory" | "product";
  externalId: string;
  children?: CatalogTreeElement[];
  partCode?: string;
  isActive?: boolean;
};

export type AdminCatalogSummary = {
  categories: CatalogCategorySummary[];
  subcategories: CatalogSubcategorySummary[];
  products: CatalogProductSummary[];
};

export type CatalogDimension = {
  parameter: string;
  value: string;
  notes?: string;
};

export type CatalogProductInput = {
  productName: string;
  partCode: string;
  categoryExternalId: string;
  subcategoryExternalId: string;
  size: string;
  material: string;
  type: string;
  finishPlating: string;
  threadStandard: string;
  sealant: string;
  temperature: string;
  pressure: string;
  connections: string;
  assemblies: string;
  grade: string;
  description: string;
  applications: string[];
  certifications: string[];
  additionalNotes: string[];
  dimensions: CatalogDimension[];
  images: string[];
  isActive: boolean;
};

export type CatalogProductDetails = CatalogProductInput & {
  externalId: string;
  createdAt: string | null;
};

const catalogCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

export function buildCatalogTree(
  catalog: AdminCatalogSummary,
): CatalogTreeElement[] {
  const productsBySubcategory = new Map<string, CatalogProductSummary[]>();

  for (const product of catalog.products) {
    const products = productsBySubcategory.get(product.subcategoryExternalId);
    if (products) products.push(product);
    else productsBySubcategory.set(product.subcategoryExternalId, [product]);
  }

  const subcategoriesByCategory = new Map<
    string,
    CatalogSubcategorySummary[]
  >();

  for (const subcategory of catalog.subcategories) {
    const subcategories = subcategoriesByCategory.get(
      subcategory.categoryExternalId,
    );
    if (subcategories) subcategories.push(subcategory);
    else {
      subcategoriesByCategory.set(subcategory.categoryExternalId, [subcategory]);
    }
  }

  return [...catalog.categories]
    .sort((a, b) => catalogCollator.compare(a.name, b.name))
    .map((category) => ({
      id: `category:${category.externalId}`,
      name: category.name,
      type: "folder" as const,
      nodeType: "category" as const,
      externalId: category.externalId,
      children: (subcategoriesByCategory.get(category.externalId) ?? [])
        .sort((a, b) => catalogCollator.compare(a.name, b.name))
        .map((subcategory) => ({
          id: `subcategory:${subcategory.externalId}`,
          name: subcategory.name,
          type: "folder" as const,
          nodeType: "subcategory" as const,
          externalId: subcategory.externalId,
          children: (productsBySubcategory.get(subcategory.externalId) ?? [])
            .sort((a, b) =>
              catalogCollator.compare(a.productName, b.productName),
            )
            .map((product) => ({
              id: `product:${product.externalId}`,
              name: product.productName,
              type: "file" as const,
              nodeType: "product" as const,
              externalId: product.externalId,
              partCode: product.partCode,
              isActive: product.isActive,
            })),
        })),
    }));
}

export function filterCatalogTree(
  elements: CatalogTreeElement[],
  query: string,
): CatalogTreeElement[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return elements;

  return elements.flatMap((element) => {
    const matches = [element.name, element.partCode]
      .filter(Boolean)
      .some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));
    const children = element.children
      ? filterCatalogTree(element.children, normalizedQuery)
      : [];

    if (!matches && children.length === 0) return [];
    return [{ ...element, children: element.children ? children : undefined }];
  });
}

export function parseCatalogList(value: string) {
  return [
    ...new Set(
      value
        .split("\\n")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function parseCatalogDimensions(value: string): CatalogDimension[] {
  return value
    .split("\\n")
    .map((line) => line.split("|").map((item) => item.trim()))
    .filter(([parameter, dimensionValue]) => parameter && dimensionValue)
    .map(([parameter, dimensionValue, notes]) => ({
      parameter: parameter!,
      value: dimensionValue!,
      ...(notes ? { notes } : {}),
    }));
}

export function catalogListToText(values: string[]) {
  return values.join("\\n");
}

export function catalogDimensionsToText(values: CatalogDimension[]) {
  return values
    .map(({ parameter, value, notes }) =>
      [parameter, value, notes].filter(Boolean).join(" | "),
    )
    .join("\\n");
}

export function createEmptyCatalogProduct(
  categoryExternalId: string,
  subcategoryExternalId: string,
): CatalogProductInput {
  return {
    productName: "",
    partCode: "",
    categoryExternalId,
    subcategoryExternalId,
    size: "",
    material: "",
    type: "",
    finishPlating: "",
    threadStandard: "",
    sealant: "",
    temperature: "",
    pressure: "",
    connections: "",
    assemblies: "",
    grade: "",
    description: "",
    applications: [],
    certifications: [],
    additionalNotes: [],
    dimensions: [],
    images: [],
    isActive: true,
  };
}
