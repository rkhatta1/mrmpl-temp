import { ConvexError, v } from "convex/values";

import {
  getSiteMediaAsset,
  validateSiteMediaReplacement,
} from "../src/lib/site-media-registry";
import { MAX_SITE_MEDIA_IMAGE_VARIANT_BYTES } from "../src/lib/site-media-image-contract";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const MAX_PAGE_OVERRIDES = 32;
const SITE_MEDIA_VARIANT_COUNT = 4;
const MAX_IMAGE_BYTES =
  MAX_SITE_MEDIA_IMAGE_VARIANT_BYTES * SITE_MEDIA_VARIANT_COUNT;

const pageValidator = v.union(
  v.literal("home"),
  v.literal("about"),
  v.literal("capabilities"),
  v.literal("buffoli-machines"),
  v.literal("one-stop-solution"),
  v.literal("iso-9001"),
  v.literal("nsf-certified"),
  v.literal("lead-free"),
  v.literal("custom-assembly"),
  v.literal("contract-manufacturing"),
  v.literal("in-house-manufacturing"),
  v.literal("retail-solutions"),
  v.literal("quality"),
  v.literal("contact"),
);

const publicOverrideValidator = v.object({
  assetId: v.string(),
  url: v.string(),
  width: v.number(),
  height: v.number(),
});

const adminOverrideValidator = v.object({
  _id: v.id("siteMediaOverrides"),
  assetId: v.string(),
  url: v.string(),
  fileKey: v.string(),
  fileKeys: v.optional(v.array(v.string())),
  mimeType: v.string(),
  width: v.number(),
  height: v.number(),
  size: v.number(),
  updatedAt: v.number(),
});

async function requireAdminIdentity(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("You must be signed in to manage site media.");
  }
  return identity;
}

function assertUploadThingUrl(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ConvexError("UploadThing returned an invalid media URL.");
  }

  const isUploadThingHost =
    parsed.hostname === "utfs.io" || parsed.hostname.endsWith(".ufs.sh");
  if (parsed.protocol !== "https:" || !isUploadThingHost) {
    throw new ConvexError("Site media must use an UploadThing URL.");
  }
}

function assertImageMetadata(args: {
  fileKey: string;
  fileKeys: string[];
  height: number;
  size: number;
  width: number;
}) {
  if (!args.fileKey.trim() || args.fileKey.length > 512) {
    throw new ConvexError("UploadThing returned an invalid file key.");
  }
  if (
    args.fileKeys.length !== SITE_MEDIA_VARIANT_COUNT ||
    args.fileKeys.some((fileKey) => !fileKey.trim() || fileKey.length > 512) ||
    new Set(args.fileKeys).size !== SITE_MEDIA_VARIANT_COUNT ||
    !args.fileKeys.includes(args.fileKey)
  ) {
    throw new ConvexError(
      "UploadThing returned an incomplete site media image set.",
    );
  }
  if (
    !Number.isFinite(args.width) ||
    !Number.isFinite(args.height) ||
    args.width <= 0 ||
    args.height <= 0 ||
    args.width > 10_000 ||
    args.height > 10_000
  ) {
    throw new ConvexError("Image dimensions are invalid.");
  }
  if (
    !Number.isFinite(args.size) ||
    args.size <= 0 ||
    args.size > MAX_IMAGE_BYTES
  ) {
    throw new ConvexError("The optimized responsive image set exceeds 3.2 MB.");
  }
}

export const listPublicByPage = query({
  args: { page: pageValidator },
  returns: v.array(publicOverrideValidator),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("siteMediaOverrides")
      .withIndex("by_page_and_asset_id", (q) => q.eq("page", args.page))
      .take(MAX_PAGE_OVERRIDES);

    return rows.map((row) => ({
      assetId: row.assetId,
      url: row.url,
      width: row.width,
      height: row.height,
    }));
  },
});

export const listAdminByPage = query({
  args: { page: pageValidator },
  returns: v.array(adminOverrideValidator),
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx);
    const rows = await ctx.db
      .query("siteMediaOverrides")
      .withIndex("by_page_and_asset_id", (q) => q.eq("page", args.page))
      .take(MAX_PAGE_OVERRIDES);

    return rows.map((row) => ({
      _id: row._id,
      assetId: row.assetId,
      url: row.url,
      fileKey: row.fileKey,
      fileKeys: row.fileKeys,
      mimeType: row.mimeType,
      width: row.width,
      height: row.height,
      size: row.size,
      updatedAt: row.updatedAt,
    }));
  },
});

export const replaceImage = mutation({
  args: {
    page: pageValidator,
    assetId: v.string(),
    url: v.string(),
    fileKey: v.string(),
    fileKeys: v.array(v.string()),
    mimeType: v.string(),
    width: v.number(),
    height: v.number(),
    size: v.number(),
  },
  returns: v.object({ previousFileKeys: v.array(v.string()) }),
  handler: async (ctx, args) => {
    const identity = await requireAdminIdentity(ctx);
    const validationError = validateSiteMediaReplacement({
      assetId: args.assetId,
      mimeType: args.mimeType,
      pageId: args.page,
    });
    if (validationError) throw new ConvexError(validationError);

    const asset = getSiteMediaAsset(args.assetId);
    if (!asset || asset.pageId !== args.page) {
      throw new ConvexError("Unknown media placement.");
    }

    assertUploadThingUrl(args.url);
    assertImageMetadata(args);

    const existing = await ctx.db
      .query("siteMediaOverrides")
      .withIndex("by_page_and_asset_id", (q) =>
        q.eq("page", args.page).eq("assetId", args.assetId),
      )
      .unique();

    if (existing?.fileKey === args.fileKey && existing.url === args.url) {
      return { previousFileKeys: [] };
    }

    const next = {
      page: args.page,
      assetId: args.assetId,
      url: args.url,
      fileKey: args.fileKey,
      mimeType: args.mimeType,
      fileKeys: args.fileKeys,
      width: args.width,
      height: args.height,
      size: args.size,
      updatedAt: Date.now(),
      updatedBy: identity.subject,
    };

    if (existing) {
      await ctx.db.patch(existing._id, next);
    } else {
      await ctx.db.insert("siteMediaOverrides", next);
    }

    return {
      previousFileKeys: existing
        ? (existing.fileKeys ?? [existing.fileKey])
        : [],
    };
  },
});
