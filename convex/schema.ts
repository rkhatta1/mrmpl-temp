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

const importProduct = v.object({
  productName: v.string(),
  partCode: v.string(),
  categoryName: v.string(),
  subcategoryName: v.string(),
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
  photoCodes: v.array(v.string()),
  isActive: v.boolean(),
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
    normalizedName: v.optional(v.string()),
    description: v.string(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_name", ["name"])
    .index("by_normalized_name", ["normalizedName"]),

  subcategories: defineTable({
    externalId: v.string(),
    name: v.string(),
    normalizedName: v.optional(v.string()),
    categoryExternalId: v.string(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_category", ["categoryExternalId"])
    .index("by_category_and_name", ["categoryExternalId", "name"])
    .index("by_category_and_normalized_name", [
      "categoryExternalId",
      "normalizedName",
    ])
    .index("by_name", ["name"]),

  products: defineTable({
    externalId: v.string(),
    productName: v.string(),
    partCode: v.string(),
    normalizedPartCode: v.optional(v.string()),
    category: namedRef,
    subCategory: namedRef,
    categoryExternalId: v.optional(v.string()),
    subcategoryExternalId: v.optional(v.string()),
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
    photoCodes: v.optional(v.array(v.string())),
    isActive: v.boolean(),
    createdAt: v.union(v.string(), v.null()),
  })
    .index("by_external_id", ["externalId"])
    .index("by_part_code", ["partCode"])
    .index("by_normalized_part_code", ["normalizedPartCode"])
    .index("by_category", ["category.name"])
    .index("by_category_external_id", ["categoryExternalId"])
    .index("by_subcategory", ["subCategory.name"])
    .index("by_subcategory_external_id", ["subcategoryExternalId"])
    .searchIndex("search_products", {
      searchField: "productName",
      filterFields: ["isActive"],
    }),

  catalogCapacity: defineTable({
    key: v.string(),
    categoryCount: v.number(),
    subcategoryCount: v.number(),
    productCount: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  catalogImportJobs: defineTable({
    externalId: v.string(),
    createdBy: v.string(),
    workbookName: v.string(),
    status: v.union(
      v.literal("staging"),
      v.literal("ready"),
      v.literal("validating"),
      v.literal("importing"),
      v.literal("retrying"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("canceled"),
    ),
    expectedRowCount: v.number(),
    stagedRowCount: v.number(),
    processedRowCount: v.number(),
    createdProductCount: v.number(),
    skippedProductCount: v.number(),
    errorCount: v.number(),
    expectedPhotoCount: v.number(),
    readyPhotoCount: v.number(),
    distinctPhotoAssetCount: v.number(),
    failureMessage: v.optional(v.string()),
    processingLeaseAt: v.optional(v.number()),
    cleanupLockedAt: v.optional(v.number()),
    providerCleanupPending: v.optional(v.boolean()),
    providerCleanupPhase: v.optional(
      v.union(v.literal("initial"), v.literal("final")),
    ),
    providerCleanupCompletedAt: v.optional(v.number()),
    stagingRetained: v.optional(v.boolean()),
    stagingPurgedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_created_by_and_updated_at", ["createdBy", "updatedAt"])
    .index("by_status_and_updated_at", ["status", "updatedAt"])
    .index("by_status_and_staging_retained_and_updated_at", [
      "status",
      "stagingRetained",
      "updatedAt",
    ])
    .index("by_provider_cleanup_pending", ["providerCleanupPending"]),

  catalogImportRows: defineTable({
    jobExternalId: v.string(),
    rowNumber: v.number(),
    normalizedPartCode: v.string(),
    product: importProduct,
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("skipped"),
      v.literal("error"),
    ),
    message: v.optional(v.string()),
  })
    .index("by_job_and_row", ["jobExternalId", "rowNumber"])
    .index("by_job_and_status_and_row", [
      "jobExternalId",
      "status",
      "rowNumber",
    ])
    .index("by_job_and_normalized_part_code", [
      "jobExternalId",
      "normalizedPartCode",
    ]),

  catalogImportCategories: defineTable({
    jobExternalId: v.string(),
    normalizedName: v.string(),
    name: v.string(),
    resolvedExternalId: v.optional(v.string()),
  })
    .index("by_job", ["jobExternalId"])
    .index("by_job_and_normalized_name", ["jobExternalId", "normalizedName"]),

  catalogImportSubcategories: defineTable({
    jobExternalId: v.string(),
    categoryNormalizedName: v.string(),
    normalizedName: v.string(),
    name: v.string(),
    resolvedExternalId: v.optional(v.string()),
  })
    .index("by_job", ["jobExternalId"])
    .index("by_job_and_category_and_normalized_name", [
      "jobExternalId",
      "categoryNormalizedName",
      "normalizedName",
    ]),

  catalogImportPhotos: defineTable({
    jobExternalId: v.string(),
    code: v.string(),
    contentHash: v.string(),
    sourceName: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("ready"),
      v.literal("error"),
    ),
    assetExternalId: v.optional(v.string()),
    holdActive: v.optional(v.boolean()),
    message: v.optional(v.string()),
  })
    .index("by_job_and_code", ["jobExternalId", "code"])
    .index("by_job_and_hash", ["jobExternalId", "contentHash"])
    .index("by_job_and_hash_and_status", [
      "jobExternalId",
      "contentHash",
      "status",
    ])
    .index("by_job_and_status", ["jobExternalId", "status"])
    .index("by_job_and_hold", ["jobExternalId", "holdActive"])
    .index("by_content_hash", ["contentHash"])
    .index("by_asset_and_hold", ["assetExternalId", "holdActive"]),

  productPhotoAssets: defineTable({
    externalId: v.string(),
    contentHash: v.string(),
    canonicalUrl: v.string(),
    variants: v.array(
      v.object({
        width: v.number(),
        customId: v.string(),
        fileKey: v.string(),
        size: v.number(),
        url: v.string(),
      }),
    ),
    lifecycle: v.optional(
      v.union(v.literal("active"), v.literal("deleting"), v.literal("deleted")),
    ),
    deleteAttemptedAt: v.optional(v.number()),
    deleteRetryCount: v.optional(v.number()),
    deletionError: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_content_hash", ["contentHash"])
    .index("by_canonical_url", ["canonicalUrl"])
    .index("by_created_at", ["createdAt"]),

  productPhotoCodes: defineTable({
    code: v.string(),
    contentHash: v.string(),
    assetExternalId: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_asset_external_id", ["assetExternalId"]),

  productPhotoLinks: defineTable({
    productExternalId: v.string(),
    assetExternalId: v.string(),
    code: v.string(),
    position: v.number(),
  })
    .index("by_product_and_position", ["productExternalId", "position"])
    .index("by_asset_external_id", ["assetExternalId"])
    .index("by_code", ["code"]),

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

  siteMediaOverrides: defineTable({
    page: v.string(),
    assetId: v.string(),
    url: v.string(),
    fileKey: v.string(),
    fileKeys: v.optional(v.array(v.string())),
    mimeType: v.string(),
    width: v.number(),
    height: v.number(),
    size: v.number(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  }).index("by_page_and_asset_id", ["page", "assetId"]),

  adminAccessSettings: defineTable({
    key: v.string(),
    encryptedCode: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
