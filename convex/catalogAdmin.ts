import { ConvexError, v } from "convex/values";

import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const MAX_CATEGORIES = 200;
const MAX_SUBCATEGORIES = 2_000;
const MAX_PRODUCTS = 5_000;
const MAX_PRODUCTS_PER_BRANCH = 4_000;

const categorySummaryValidator = v.object({
  externalId: v.string(),
  name: v.string(),
  description: v.string(),
});

const subcategorySummaryValidator = v.object({
  externalId: v.string(),
  name: v.string(),
  categoryExternalId: v.string(),
});

const productSummaryValidator = v.object({
  externalId: v.string(),
  productName: v.string(),
  partCode: v.string(),
  categoryExternalId: v.string(),
  subcategoryExternalId: v.string(),
  isActive: v.boolean(),
});

const dimensionFields = {
  parameter: v.string(),
  value: v.string(),
  notes: v.optional(v.string()),
};

const productInputFields = {
  productName: v.string(),
  partCode: v.string(),
  categoryExternalId: v.string(),
  subcategoryExternalId: v.string(),
  size: v.string(),
  material: v.string(),
  type: v.string(),
  finishPlating: v.string(),
  threadStandard: v.string(),
  sealant: v.string(),
  temperature: v.string(),
  pressure: v.string(),
  connections: v.string(),
  assemblies: v.string(),
  grade: v.string(),
  description: v.string(),
  applications: v.array(v.string()),
  certifications: v.array(v.string()),
  additionalNotes: v.array(v.string()),
  dimensions: v.array(v.object(dimensionFields)),
  images: v.array(v.string()),
  isActive: v.boolean(),
};

const productInputValidator = v.object(productInputFields);
const productDetailsValidator = v.object({
  externalId: v.string(),
  ...productInputFields,
  createdAt: v.union(v.string(), v.null()),
});

type ProductInput = {
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
  dimensions: Array<{ parameter: string; value: string; notes?: string }>;
  images: string[];
  isActive: boolean;
};

async function requireAdminIdentity(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("You must be signed in to manage the catalog.");
  }
  return identity;
}

function requiredText(value: string, label: string, maxLength: number) {
  const normalized = value.trim();
  if (!normalized) throw new ConvexError(label + " is required.");
  if (normalized.length > maxLength) {
    throw new ConvexError(
      label + " must be at most " + maxLength + " characters.",
    );
  }
  return normalized;
}

function optionalText(value: string, label: string, maxLength: number) {
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ConvexError(
      label + " must be at most " + maxLength + " characters.",
    );
  }
  return normalized;
}

function textList(values: string[], label: string, maxItems: number) {
  if (values.length > maxItems) {
    throw new ConvexError(label + " can contain at most " + maxItems + " items.");
  }
  return values.map((value) => requiredText(value, label + " item", 500));
}

function assertProductImage(value: string) {
  if (value.startsWith("/")) return value;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ConvexError("Product images must use a root-relative or HTTPS URL.");
  }
  if (parsed.protocol !== "https:") {
    throw new ConvexError("Product images must use a root-relative or HTTPS URL.");
  }
  return parsed.toString();
}

function normalizeProductInput(product: ProductInput) {
  if (product.images.length > 12) {
    throw new ConvexError("A product can contain at most 12 images.");
  }
  if (product.dimensions.length > 50) {
    throw new ConvexError("A product can contain at most 50 dimensions.");
  }

  return {
    productName: requiredText(product.productName, "Product name", 200),
    partCode: requiredText(product.partCode, "Part code", 120),
    categoryExternalId: requiredText(
      product.categoryExternalId,
      "Category",
      200,
    ),
    subcategoryExternalId: requiredText(
      product.subcategoryExternalId,
      "Subcategory",
      200,
    ),
    size: optionalText(product.size, "Size", 500),
    material: optionalText(product.material, "Material", 500),
    type: optionalText(product.type, "Type", 500),
    finishPlating: optionalText(product.finishPlating, "Finish/plating", 500),
    threadStandard: optionalText(product.threadStandard, "Thread standard", 500),
    sealant: optionalText(product.sealant, "Sealant", 500),
    temperature: optionalText(product.temperature, "Temperature", 500),
    pressure: optionalText(product.pressure, "Pressure", 500),
    connections: optionalText(product.connections, "Connections", 2_000),
    assemblies: optionalText(product.assemblies, "Assemblies", 2_000),
    grade: optionalText(product.grade, "Grade", 500),
    description: optionalText(product.description, "Description", 10_000),
    applications: textList(product.applications, "Applications", 50),
    certifications: textList(product.certifications, "Certifications", 50),
    additionalNotes: textList(product.additionalNotes, "Additional notes", 50),
    dimensions: product.dimensions.map((dimension) => ({
      parameter: requiredText(dimension.parameter, "Dimension parameter", 200),
      value: requiredText(dimension.value, "Dimension value", 500),
      ...(dimension.notes?.trim()
        ? { notes: optionalText(dimension.notes, "Dimension notes", 500) }
        : {}),
    })),
    images: product.images.map((image) => assertProductImage(image.trim())),
    isActive: product.isActive,
  };
}

async function getCategory(ctx: MutationCtx | QueryCtx, externalId: string) {
  return await ctx.db
    .query("categories")
    .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
    .unique();
}

async function getSubcategory(ctx: MutationCtx | QueryCtx, externalId: string) {
  return await ctx.db
    .query("subcategories")
    .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
    .unique();
}

type StoredProductReferences = {
  category: { _id: string; name: string };
  subCategory: { _id: string; name: string };
  categoryExternalId?: string;
  subcategoryExternalId?: string;
};

async function resolveProductReferences(
  ctx: QueryCtx,
  product: StoredProductReferences,
) {
  const category = product.categoryExternalId
    ? await getCategory(ctx, product.categoryExternalId)
    : null;
  const legacyCategory = category
    ? null
    : await ctx.db
        .query("categories")
        .withIndex("by_name", (q) => q.eq("name", product.category.name))
        .unique();
  const categoryExternalId =
    category?.externalId ?? legacyCategory?.externalId ?? product.category._id;

  const subcategory = product.subcategoryExternalId
    ? await getSubcategory(ctx, product.subcategoryExternalId)
    : null;
  const legacySubcategory = subcategory
    ? null
    : await ctx.db
        .query("subcategories")
        .withIndex("by_category_and_name", (q) =>
          q
            .eq("categoryExternalId", categoryExternalId)
            .eq("name", product.subCategory.name),
        )
        .unique();

  return {
    categoryExternalId,
    subcategoryExternalId:
      subcategory?.externalId ??
      legacySubcategory?.externalId ??
      product.subCategory._id,
  };
}

function assertBranchSize<T>(products: T[]) {
  if (products.length > MAX_PRODUCTS_PER_BRANCH) {
    throw new ConvexError(
      "This branch is too large to update safely in one operation.",
    );
  }
  return products;
}

async function getCategoryProducts(
  ctx: MutationCtx,
  category: { externalId: string; name: string },
) {
  const [indexed, legacy] = await Promise.all([
    ctx.db
      .query("products")
      .withIndex("by_category_external_id", (q) =>
        q.eq("categoryExternalId", category.externalId),
      )
      .take(MAX_PRODUCTS_PER_BRANCH + 1),
    ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category.name", category.name))
      .take(MAX_PRODUCTS + 1),
  ]);
  const products = new Map(indexed.map((product) => [product._id, product]));
  for (const product of legacy) {
    if (product.category._id === category.externalId) {
      products.set(product._id, product);
    }
  }
  return assertBranchSize([...products.values()]);
}

async function getSubcategoryProducts(
  ctx: MutationCtx,
  subcategory: { externalId: string; name: string },
) {
  const [indexed, legacy] = await Promise.all([
    ctx.db
      .query("products")
      .withIndex("by_subcategory_external_id", (q) =>
        q.eq("subcategoryExternalId", subcategory.externalId),
      )
      .take(MAX_PRODUCTS_PER_BRANCH + 1),
    ctx.db
      .query("products")
      .withIndex("by_subcategory", (q) =>
        q.eq("subCategory.name", subcategory.name),
      )
      .take(MAX_PRODUCTS + 1),
  ]);
  const products = new Map(indexed.map((product) => [product._id, product]));
  for (const product of legacy) {
    if (product.subCategory._id === subcategory.externalId) {
      products.set(product._id, product);
    }
  }
  return assertBranchSize([...products.values()]);
}

function storedProduct(
  product: ReturnType<typeof normalizeProductInput>,
  category: { externalId: string; name: string },
  subcategory: { externalId: string; name: string },
) {
  return {
    productName: product.productName,
    partCode: product.partCode,
    category: { _id: category.externalId, name: category.name },
    subCategory: { _id: subcategory.externalId, name: subcategory.name },
    categoryExternalId: category.externalId,
    subcategoryExternalId: subcategory.externalId,
    size: product.size,
    material: product.material,
    type: product.type,
    finishPlating: product.finishPlating,
    threadStandard: product.threadStandard,
    sealant: product.sealant,
    temperature: product.temperature,
    pressure: product.pressure,
    connections: product.connections,
    assemblies: product.assemblies,
    grade: product.grade,
    description: product.description,
    applications: product.applications,
    certifications: product.certifications,
    additionalNotes: product.additionalNotes,
    dimensions: product.dimensions,
    images: product.images,
    isActive: product.isActive,
  };
}

export const listCatalog = query({
  args: {},
  returns: v.object({
    categories: v.array(categorySummaryValidator),
    subcategories: v.array(subcategorySummaryValidator),
    products: v.array(productSummaryValidator),
  }),
  handler: async (ctx) => {
    await requireAdminIdentity(ctx);

    const [categories, subcategories, products] = await Promise.all([
      ctx.db
        .query("categories")
        .withIndex("by_name")
        .take(MAX_CATEGORIES + 1),
      ctx.db
        .query("subcategories")
        .withIndex("by_name")
        .take(MAX_SUBCATEGORIES + 1),
      ctx.db
        .query("products")
        .withIndex("by_category")
        .take(MAX_PRODUCTS + 1),
    ]);

    if (
      categories.length > MAX_CATEGORIES ||
      subcategories.length > MAX_SUBCATEGORIES ||
      products.length > MAX_PRODUCTS
    ) {
      throw new ConvexError(
        "The catalog is too large for the current admin tree limits.",
      );
    }

    const categoryReferences = new Map<string, string>();
    for (const category of categories) {
      categoryReferences.set("id:" + category.externalId, category.externalId);
      categoryReferences.set("name:" + category.name, category.externalId);
    }

    const subcategoryReferences = new Map<string, string>();
    for (const subcategory of subcategories) {
      subcategoryReferences.set(
        "id:" + subcategory.externalId,
        subcategory.externalId,
      );
      subcategoryReferences.set(
        "name:" + subcategory.categoryExternalId + ":" + subcategory.name,
        subcategory.externalId,
      );
    }

    return {
      categories: categories.map(({ externalId, name, description }) => ({
        externalId,
        name,
        description,
      })),
      subcategories: subcategories.map(
        ({ externalId, name, categoryExternalId }) => ({
          externalId,
          name,
          categoryExternalId,
        }),
      ),
      products: products.map(
        ({
          externalId,
          productName,
          partCode,
          category,
          subCategory,
          categoryExternalId,
          subcategoryExternalId,
          isActive,
        }) => {
          const canonicalCategoryExternalId =
            categoryReferences.get("id:" + (categoryExternalId ?? "")) ??
            categoryReferences.get("id:" + category._id) ??
            categoryReferences.get("name:" + category.name) ??
            categoryReferences.get("name:" + category._id) ??
            categoryExternalId ??
            category._id;
          const canonicalSubcategoryExternalId =
            subcategoryReferences.get(
              "id:" + (subcategoryExternalId ?? ""),
            ) ??
            subcategoryReferences.get("id:" + subCategory._id) ??
            subcategoryReferences.get(
              "name:" +
                canonicalCategoryExternalId +
                ":" +
                subCategory.name,
            ) ??
            subcategoryReferences.get(
              "name:" +
                canonicalCategoryExternalId +
                ":" +
                subCategory._id,
            ) ??
            subcategoryExternalId ??
            subCategory._id;

          return {
            externalId,
            productName,
            partCode,
            categoryExternalId: canonicalCategoryExternalId,
            subcategoryExternalId: canonicalSubcategoryExternalId,
            isActive,
          };
        },
      ),
    };
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.string(),
  },
  returns: v.object({ externalId: v.string() }),
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx);
    const name = requiredText(args.name, "Category name", 120);
    const description = args.description.trim();
    if (description.length > 2_000) {
      throw new ConvexError("Category description must be at most 2000 characters.");
    }

    const duplicate = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", name))
      .unique();
    if (duplicate) throw new ConvexError("A category with this name already exists.");

    const externalId = crypto.randomUUID();
    await ctx.db.insert("categories", { externalId, name, description });
    return { externalId };
  },
});

export const updateCategory = mutation({
  args: {
    externalId: v.string(),
    name: v.string(),
    description: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx);
    const category = await getCategory(ctx, args.externalId);
    if (!category) throw new ConvexError("The category no longer exists.");

    const name = requiredText(args.name, "Category name", 120);
    const description = optionalText(
      args.description,
      "Category description",
      2_000,
    );
    const duplicate = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", name))
      .unique();
    if (duplicate && duplicate._id !== category._id) {
      throw new ConvexError("A category with this name already exists.");
    }

    if (name !== category.name) {
      const products = await getCategoryProducts(ctx, category);
      for (const product of products) {
        await ctx.db.patch(product._id, {
          category: { _id: category.externalId, name },
          categoryExternalId: category.externalId,
        });
      }
    }
    await ctx.db.patch(category._id, { name, description });
    return null;
  },
});

export const deleteCategory = mutation({
  args: { externalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx);
    const category = await getCategory(ctx, args.externalId);
    if (!category) return null;

    const [subcategory, product] = await Promise.all([
      ctx.db
        .query("subcategories")
        .withIndex("by_category", (q) =>
          q.eq("categoryExternalId", category.externalId),
        )
        .first(),
      getCategoryProducts(ctx, category).then((products) => products[0]),
    ]);
    if (subcategory) {
      throw new ConvexError("Delete this category's subcategories first.");
    }
    if (product) throw new ConvexError("Delete this category's products first.");

    await ctx.db.delete(category._id);
    return null;
  },
});

export const createSubcategory = mutation({
  args: {
    name: v.string(),
    categoryExternalId: v.string(),
  },
  returns: v.object({ externalId: v.string() }),
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx);
    const name = requiredText(args.name, "Subcategory name", 120);
    const category = await getCategory(ctx, args.categoryExternalId);
    if (!category) throw new ConvexError("The selected category no longer exists.");

    const duplicate = await ctx.db
      .query("subcategories")
      .withIndex("by_category_and_name", (q) =>
        q.eq("categoryExternalId", category.externalId).eq("name", name),
      )
      .unique();
    if (duplicate) {
      throw new ConvexError("This category already contains that subcategory.");
    }

    const externalId = crypto.randomUUID();
    await ctx.db.insert("subcategories", {
      externalId,
      name,
      categoryExternalId: category.externalId,
    });
    return { externalId };
  },
});

export const updateSubcategory = mutation({
  args: {
    externalId: v.string(),
    name: v.string(),
    categoryExternalId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx);
    const [subcategory, category] = await Promise.all([
      getSubcategory(ctx, args.externalId),
      getCategory(ctx, args.categoryExternalId),
    ]);
    if (!subcategory) throw new ConvexError("The subcategory no longer exists.");
    if (!category) throw new ConvexError("The selected category no longer exists.");

    const name = requiredText(args.name, "Subcategory name", 120);
    const duplicate = await ctx.db
      .query("subcategories")
      .withIndex("by_category_and_name", (q) =>
        q.eq("categoryExternalId", category.externalId).eq("name", name),
      )
      .unique();
    if (duplicate && duplicate._id !== subcategory._id) {
      throw new ConvexError("This category already contains that subcategory.");
    }

    if (
      name !== subcategory.name ||
      category.externalId !== subcategory.categoryExternalId
    ) {
      const products = await getSubcategoryProducts(ctx, subcategory);
      for (const product of products) {
        await ctx.db.patch(product._id, {
          category: { _id: category.externalId, name: category.name },
          subCategory: { _id: subcategory.externalId, name },
          categoryExternalId: category.externalId,
          subcategoryExternalId: subcategory.externalId,
        });
      }
    }

    await ctx.db.patch(subcategory._id, {
      name,
      categoryExternalId: category.externalId,
    });
    return null;
  },
});

export const deleteSubcategory = mutation({
  args: { externalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx);
    const subcategory = await getSubcategory(ctx, args.externalId);
    if (!subcategory) return null;

    const product = (await getSubcategoryProducts(ctx, subcategory))[0];
    if (product) throw new ConvexError("Delete this subcategory's products first.");

    await ctx.db.delete(subcategory._id);
    return null;
  },
});

export const createProduct = mutation({
  args: { product: productInputValidator },
  returns: v.object({ externalId: v.string() }),
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx);
    const product = normalizeProductInput(args.product);
    const [category, subcategory, duplicate] = await Promise.all([
      getCategory(ctx, product.categoryExternalId),
      getSubcategory(ctx, product.subcategoryExternalId),
      ctx.db
        .query("products")
        .withIndex("by_part_code", (q) => q.eq("partCode", product.partCode))
        .unique(),
    ]);
    if (!category) throw new ConvexError("The selected category no longer exists.");
    if (!subcategory || subcategory.categoryExternalId !== category.externalId) {
      throw new ConvexError("The selected subcategory does not belong to this category.");
    }
    if (duplicate) throw new ConvexError("A product with this part code already exists.");

    const externalId = crypto.randomUUID();
    await ctx.db.insert("products", {
      externalId,
      ...storedProduct(product, category, subcategory),
      createdAt: new Date().toISOString(),
    });
    return { externalId };
  },
});

export const updateProduct = mutation({
  args: { externalId: v.string(), product: productInputValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx);
    const existing = await ctx.db
      .query("products")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!existing) throw new ConvexError("The product no longer exists.");

    const product = normalizeProductInput(args.product);
    const [category, subcategory, duplicate] = await Promise.all([
      getCategory(ctx, product.categoryExternalId),
      getSubcategory(ctx, product.subcategoryExternalId),
      ctx.db
        .query("products")
        .withIndex("by_part_code", (q) => q.eq("partCode", product.partCode))
        .unique(),
    ]);
    if (!category) throw new ConvexError("The selected category no longer exists.");
    if (!subcategory || subcategory.categoryExternalId !== category.externalId) {
      throw new ConvexError("The selected subcategory does not belong to this category.");
    }
    if (duplicate && duplicate._id !== existing._id) {
      throw new ConvexError("A product with this part code already exists.");
    }

    await ctx.db.patch(existing._id, storedProduct(product, category, subcategory));
    return null;
  },
});

export const renameProduct = mutation({
  args: { externalId: v.string(), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx);
    const product = await ctx.db
      .query("products")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!product) throw new ConvexError("The product no longer exists.");
    await ctx.db.patch(product._id, {
      productName: requiredText(args.name, "Product name", 200),
    });
    return null;
  },
});

export const deleteProduct = mutation({
  args: { externalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx);
    const product = await ctx.db
      .query("products")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (product) await ctx.db.delete(product._id);
    return null;
  },
});

export const getProduct = query({
  args: { externalId: v.string() },
  returns: v.union(productDetailsValidator, v.null()),
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx);
    const product = await ctx.db
      .query("products")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!product) return null;

    const references = await resolveProductReferences(ctx, product);

    return {
      externalId: product.externalId,
      productName: product.productName,
      partCode: product.partCode,
      categoryExternalId: references.categoryExternalId,
      subcategoryExternalId: references.subcategoryExternalId,
      size: product.size,
      material: product.material,
      type: product.type,
      finishPlating: product.finishPlating,
      threadStandard: product.threadStandard,
      sealant: product.sealant,
      temperature: product.temperature,
      pressure: product.pressure,
      connections: product.connections,
      assemblies: product.assemblies,
      grade: product.grade,
      description: product.description,
      applications: product.applications,
      certifications: product.certifications,
      additionalNotes: product.additionalNotes,
      dimensions: product.dimensions,
      images: product.images,
      isActive: product.isActive,
      createdAt: product.createdAt,
    };
  },
});
