import { UploadThingError, UTFiles } from "uploadthing/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

import { isAuthenticated } from "@/lib/auth-server";
import {
  MAX_PRODUCT_IMAGE_VARIANT_BYTES,
  getProductImageVariantUrl,
  validateProductImageVariantFilenames,
} from "@/lib/product-image-contract";

const f = createUploadthing();
// UploadThing's runtime accepts any integer FileSize, but its v7 type only
// enumerates power-of-two quantities. Keep the actual route limit at 50 KB.
const PRODUCT_IMAGE_MAX_FILE_SIZE = "50KB" as "64KB";

export const siteMediaFileRouter = {
  siteMediaImage: f({
    image: {
      maxFileCount: 1,
      maxFileSize: "8MB",
      minFileCount: 1,
    },
  })
    .middleware(async () => {
      if (!(await isAuthenticated())) {
        throw new UploadThingError("Unauthorized");
      }
      return {};
    })
    .onUploadComplete(async ({ file }) => ({
      fileKey: file.key,
      mimeType: file.type,
      name: file.name,
      size: file.size,
      url: file.ufsUrl,
    })),
  productImage: f({
    image: {
      maxFileCount: 4,
      maxFileSize: PRODUCT_IMAGE_MAX_FILE_SIZE,
      minFileCount: 4,
    },
  })
    .middleware(async ({ files }) => {
      if (!(await isAuthenticated())) {
        throw new UploadThingError("Unauthorized");
      }
      if (
        files.some((file) => file.size > MAX_PRODUCT_IMAGE_VARIANT_BYTES)
      ) {
        throw new UploadThingError(
          "Each product image variant must be 50 KB or smaller.",
        );
      }

      const customIds = validateProductImageVariantFilenames(
        files.map((file) => file.name),
      );
      if (!customIds) {
        throw new UploadThingError(
          "Upload one complete 480, 768, 880, and 1080 product image set.",
        );
      }

      return {
        [UTFiles]: files.map((file, index) => ({
          ...file,
          customId: customIds[index],
        })),
      };
    })
    .onUploadComplete(async ({ file }) => {
      const url = getProductImageVariantUrl(file.ufsUrl, file.customId);
      if (!url) {
        throw new UploadThingError(
          "The product image URL could not be finalized.",
        );
      }

      return {
        customId: file.customId,
        fileKey: file.key,
        mimeType: file.type,
        name: file.name,
        size: file.size,
        url,
      };
    }),
} satisfies FileRouter;

export type SiteMediaFileRouter = typeof siteMediaFileRouter;
