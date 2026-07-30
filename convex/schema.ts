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
    searchText: v.optional(v.string()),
    photoUrl: v.union(v.string(), v.null()),
    submittedAt: v.number(),
  })
    .index("by_submitted_at", ["submittedAt"])
    .index("by_email", ["email"])
    .searchIndex("search_contacts", {
      searchField: "searchText",
    }),

  brandThemeSettings: defineTable({
    key: v.string(),
    values: brandThemeValues,
    updatedAt: v.number(),
    updatedBy: v.string(),
  }).index("by_key", ["key"]),

  metalPrices: defineTable({
    apiCode: v.optional(v.string()),
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
    sourceTimestamp: v.optional(v.number()),
  })
    .index("by_api_code", ["apiCode"])
    .index("by_symbol", ["symbol"])
    .index("by_sort_order", ["sortOrder"]),

  metalMarketPrices: defineTable({
    apiCode: v.string(),
    price: v.number(),
    change: v.number(),
    changePercent: v.number(),
    currency: v.string(),
    unit: v.string(),
    sourceTimestamp: v.number(),
    updatedAt: v.number(),
  }).index("by_api_code", ["apiCode"]),

  metalApiUsage: defineTable({
    provider: v.string(),
    month: v.string(),
    count: v.number(),
    limit: v.number(),
    lastRequestedAt: v.number(),
  }).index("by_provider_and_month", ["provider", "month"]),

  metalApiSyncState: defineTable({
    key: v.string(),
    status: v.union(
      v.literal("syncing"),
      v.literal("success"),
      v.literal("error"),
    ),
    totalRequests: v.number(),
    lastAttemptDay: v.string(),
    lastAttemptAt: v.number(),
    lastSuccessAt: v.optional(v.number()),
    sourceTimestamp: v.optional(v.number()),
    error: v.optional(v.string()),
  }).index("by_key", ["key"]),

  adminAccessSettings: defineTable({
    key: v.string(),
    encryptedCode: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
