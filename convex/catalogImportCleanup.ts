"use node";

import { makeFunctionReference } from "convex/server";
import { v } from "convex/values";
import { UTApi } from "uploadthing/server";

import { parseBulkProductPhotoCustomId } from "../src/lib/bulk-product-photo-contract";
import { internalAction } from "./_generated/server";

const getDeletingPhotoAssetReference = makeFunctionReference<
  "query",
  { assetExternalId: string },
  { fileKeys: string[] } | null
>("catalogImport:getDeletingPhotoAsset");
const completePhotoAssetDeletionReference = makeFunctionReference<
  "mutation",
  { assetExternalId: string },
  null
>("catalogImport:completePhotoAssetDeletion");
const failPhotoAssetDeletionReference = makeFunctionReference<
  "mutation",
  { assetExternalId: string; message: string },
  null
>("catalogImport:failPhotoAssetDeletion");
const classifyJobPhotoUploadsReference = makeFunctionReference<
  "query",
  {
    cleanupLockedAt: number;
    files: Array<{ contentHash: string; fileKey: string }>;
    jobExternalId: string;
    phase: "initial" | "final";
  },
  { deletableFileKeys: string[] } | null
>("catalogImport:classifyJobPhotoUploads");
const completeJobPhotoSweepReference = makeFunctionReference<
  "mutation",
  {
    cleanupLockedAt: number;
    jobExternalId: string;
    phase: "initial" | "final";
  },
  null
>("catalogImport:completeJobPhotoSweep");
const sweepJobUploadsReference = makeFunctionReference<
  "action",
  {
    cleanupLockedAt: number;
    jobExternalId: string;
    offset: number;
    phase: "initial" | "final";
  },
  null
>("catalogImportCleanup:sweepJobUploads");

function uploadThingApi() {
  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) throw new Error("UPLOADTHING_TOKEN is not configured.");
  return new UTApi({ token, logLevel: "Error" });
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 1_000) || "UploadThing deletion failed.";
}

export const deletePhotoAsset = internalAction({
  args: { assetExternalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const asset = await ctx.runQuery(getDeletingPhotoAssetReference, args);
    if (!asset) return null;
    try {
      const result = await uploadThingApi().deleteFiles(asset.fileKeys);
      if (!result.success) {
        throw new Error(
          `UploadThing deleted ${result.deletedCount} of ${asset.fileKeys.length} files.`,
        );
      }
      await ctx.runMutation(completePhotoAssetDeletionReference, args);
    } catch (error) {
      await ctx.runMutation(failPhotoAssetDeletionReference, {
        ...args,
        message: errorMessage(error),
      });
    }
    return null;
  },
});

export const sweepJobUploads = internalAction({
  args: {
    cleanupLockedAt: v.number(),
    jobExternalId: v.string(),
    offset: v.number(),
    phase: v.union(v.literal("initial"), v.literal("final")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const api = uploadThingApi();
    const result = await api.listFiles({ limit: 100, offset: args.offset });
    const files = result.files.flatMap((file) => {
      const identity = parseBulkProductPhotoCustomId(file.customId);
      if (
        !identity?.jobExternalId ||
        identity.jobExternalId !== args.jobExternalId ||
        file.status !== "Uploaded"
      ) {
        return [];
      }
      return [{ contentHash: identity.contentHash, fileKey: file.key }];
    });
    const classification = await ctx.runQuery(
      classifyJobPhotoUploadsReference,
      {
        cleanupLockedAt: args.cleanupLockedAt,
        files,
        jobExternalId: args.jobExternalId,
        phase: args.phase,
      },
    );
    if (!classification) return null;
    let deleted = false;
    if (classification.deletableFileKeys.length > 0) {
      const deletion = await api.deleteFiles(classification.deletableFileKeys);
      if (!deletion.success) {
        throw new Error("UploadThing could not delete job-scoped uploads.");
      }
      deleted = deletion.success && deletion.deletedCount > 0;
    }
    if (result.hasMore) {
      await ctx.scheduler.runAfter(0, sweepJobUploadsReference, {
        cleanupLockedAt: args.cleanupLockedAt,
        jobExternalId: args.jobExternalId,
        offset: deleted ? args.offset : args.offset + result.files.length,
        phase: args.phase,
      });
    } else {
      await ctx.runMutation(completeJobPhotoSweepReference, {
        cleanupLockedAt: args.cleanupLockedAt,
        jobExternalId: args.jobExternalId,
        phase: args.phase,
      });
    }
    return null;
  },
});
