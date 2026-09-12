import { ConvexError } from "convex/values";

import {
  getBulkProductPhotoSiblingCustomId,
  getBulkProductPhotoVariantUrl,
} from "../src/lib/bulk-product-photo-contract";
import type { MutationCtx } from "./_generated/server";

const MAX_PRODUCT_PHOTOS = 12;

function canonicalBulkPhotoUrl(image: string) {
  try {
    const url = new URL(image);
    const customId = getBulkProductPhotoSiblingCustomId(
      url.pathname.split("/").at(-1),
      1080,
    );
    const canonical = getBulkProductPhotoVariantUrl(image, customId);
    if (!canonical) return null;
    const normalized = new URL(canonical);
    normalized.search = "";
    normalized.hash = "";
    return normalized.toString();
  } catch {
    return null;
  }
}

export async function clearProductPhotoLinks(
  ctx: MutationCtx,
  productExternalId: string,
) {
  const links = await ctx.db
    .query("productPhotoLinks")
    .withIndex("by_product_and_position", (query) =>
      query.eq("productExternalId", productExternalId),
    )
    .take(MAX_PRODUCT_PHOTOS + 1);
  for (const link of links) await ctx.db.delete(link._id);
}

export async function syncProductPhotoLinks(
  ctx: MutationCtx,
  productExternalId: string,
  images: string[],
) {
  const existingLinks = await ctx.db
    .query("productPhotoLinks")
    .withIndex("by_product_and_position", (query) =>
      query.eq("productExternalId", productExternalId),
    )
    .take(MAX_PRODUCT_PHOTOS + 1);
  const retainedLinkIndexes = new Set<number>();
  const plannedLinks: Array<{
    assetExternalId: string;
    code: string;
    position: number;
  }> = [];
  const photoCodes: string[] = [];

  for (const [position, image] of images.entries()) {
    const bulkPhotoUrl = canonicalBulkPhotoUrl(image);
    const asset = await ctx.db
      .query("productPhotoAssets")
      .withIndex("by_canonical_url", (query) =>
        query.eq("canonicalUrl", bulkPhotoUrl ?? image),
      )
      .first();
    if (!asset) {
      if (bulkPhotoUrl) {
        throw new ConvexError(
          "This bulk product photo is no longer available. Upload its source image again.",
        );
      }
      continue;
    }
    if (asset.lifecycle && asset.lifecycle !== "active") {
      throw new ConvexError(
        "This bulk product photo is unavailable while storage cleanup runs.",
      );
    }

    const retainedIndex = existingLinks.findIndex(
      (link, index) =>
        !retainedLinkIndexes.has(index) &&
        link.assetExternalId === asset.externalId,
    );
    const retained = retainedIndex >= 0 ? existingLinks[retainedIndex] : null;
    if (retained) retainedLinkIndexes.add(retainedIndex);
    const code = retained
      ? retained.code
      : (
          await ctx.db
            .query("productPhotoCodes")
            .withIndex("by_asset_external_id", (query) =>
              query.eq("assetExternalId", asset.externalId),
            )
            .first()
        )?.code;
    if (!code) continue;

    plannedLinks.push({
      assetExternalId: asset.externalId,
      code,
      position,
    });
    photoCodes.push(code);
  }

  for (const link of existingLinks) await ctx.db.delete(link._id);
  for (const link of plannedLinks) {
    await ctx.db.insert("productPhotoLinks", {
      productExternalId,
      ...link,
    });
  }

  return photoCodes;
}
