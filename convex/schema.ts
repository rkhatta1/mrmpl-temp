import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const namedRef = v.object({
  _id: v.string(),
  name: v.string(),
});

const dimension = v.object({
  parameter: v.string(),
  value: v.string(),
  notes: v.optional(v.string()),
});

const brandThemeValues = v.object({
  primaryText: v.string(),
  secondaryText: v.string(),
  primaryAccent: v.string(),
  surfaceTint: v.string(),
  buttonPrimary: v.string(),
  buttonHover: v.string(),
  footerStart: v.string(),
  footerEnd: v.string(),
});

export default defineSchema({
  categories: defineTable({
    externalId: v.string(),
    name: v.string(),
    description: v.string(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_name", ["name"]),

  subcategories: defineTable({
    externalId: v.string(),
    name: v.string(),
    categoryExternalId: v.string(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_category", ["categoryExternalId"])
    .index("by_name", ["name"]),

  products: defineTable({
    externalId: v.string(),
    productName: v.string(),
    partCode: v.string(),
    category: namedRef,
    subCategory: namedRef,
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
    dimensions: v.array(dimension),
    images: v.array(v.string()),
    isActive: v.boolean(),
    createdAt: v.union(v.string(), v.null()),
  })
    .index("by_external_id", ["externalId"])
    .index("by_part_code", ["partCode"])
    .index("by_category", ["category.name"])
    .index("by_subcategory", ["subCategory.name"])
    .searchIndex("search_products", {
      searchField: "productName",
      filterFields: ["isActive"],
    }),

  contacts: defineTable({
    name: v.string(),
    contactNumber: v.string(),
    email: v.string(),
    companyName: v.string(),
    description: v.string(),
    photoUrl: v.union(v.string(), v.null()),
    submittedAt: v.number(),
  })
    .index("by_submitted_at", ["submittedAt"])
    .index("by_email", ["email"]),

  brandThemeSettings: defineTable({
    key: v.string(),
    values: brandThemeValues,
    updatedAt: v.number(),
    updatedBy: v.string(),
  }).index("by_key", ["key"]),

  metalPrices: defineTable({
    name: v.string(),
    symbol: v.string(),
    price: v.number(),
    change: v.number(),
    changePercent: v.number(),
    unit: v.string(),
    currency: v.string(),
    sortOrder: v.number(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index("by_symbol", ["symbol"])
    .index("by_sort_order", ["sortOrder"]),
});
