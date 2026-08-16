import { UploadThingError, UTFiles } from "uploadthing/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

import { isAuthenticated } from "@/lib/auth-server";
import {
  MAX_BULK_PRODUCT_PHOTO_VARIANT_BYTES,
  getBulkProductPhotoVariantUrl,
  validateBulkProductPhotoVariantFilenames,
} from "@/lib/bulk-product-photo-contract";
import {
  MAX_PRODUCT_IMAGE_VARIANT_BYTES,
  getProductImageVariantUrl,
  validateProductImageVariantFilenames,
} from "@/lib/product-image-contract";
import {
  MAX_SITE_MEDIA_IMAGE_VARIANT_BYTES,
  getSiteMediaImageVariantUrl,
  validateSiteMediaImageVariantFilenames,
} from "@/lib/site-media-image-contract";

const f = createUploadthing();
// UploadThing's runtime accepts arbitrary integer FileSize strings, while its
// type only enumerates specific quantities. Keep the actual route limits exact.
const PRODUCT_IMAGE_MAX_FILE_SIZE = "50KB" as "64KB";
const SITE_MEDIA_IMAGE_MAX_FILE_SIZE = "800KB" as "1MB";

export const siteMediaFileRouter = {
  bulkProductPhoto: f({
    image: {
      maxFileCount: 40,
      maxFileSize: PRODUCT_IMAGE_MAX_FILE_SIZE,
      minFileCount: 4,
    },
  })
    .middleware(async ({ files }) => {
      if (!(await isAuthenticated())) {
        throw new UploadThingError("Unauthorized");
      }
      if (
        files.some(
          (file) => file.size > MAX_BULK_PRODUCT_PHOTO_VARIANT_BYTES,
        )
      ) {
        throw new UploadThingError(
          "Each bulk product photo variant must be 50 KB or smaller.",
        );
      }
      const customIds = validateBulkProductPhotoVariantFilenames(
        files.map((file) => file.name),
      );
      if (!customIds) {
        throw new UploadThingError(
          "Upload complete 480, 768, 880, and 1080 bulk product photo sets.",
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
      const url = getBulkProductPhotoVariantUrl(file.ufsUrl, file.customId);
      if (!url) {
        throw new UploadThingError(
          "The bulk product photo URL could not be finalized.",
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
  siteMediaImage: f({
    image: {
      maxFileCount: 4,
      maxFileSize: SITE_MEDIA_IMAGE_MAX_FILE_SIZE,
      minFileCount: 4,
    },
  })
    .middleware(async ({ files }) => {
      if (!(await isAuthenticated())) {
        throw new UploadThingError("Unauthorized");
      }
      if (
        files.some((file) => file.size > MAX_SITE_MEDIA_IMAGE_VARIANT_BYTES)
      ) {
        throw new UploadThingError(
          "Each site media image variant must be 800 KB or smaller.",
        );
      }

      const customIds = validateSiteMediaImageVariantFilenames(
        files.map((file) => file.name),
      );
      if (!customIds) {
        throw new UploadThingError(
          "Upload one complete 480, 768, 880, and 1080 site media image set.",
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
      const url = getSiteMediaImageVariantUrl(file.ufsUrl, file.customId);
      if (!url) {
        throw new UploadThingError(
          "The site media image URL could not be finalized.",
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
      if (files.some((file) => file.size > MAX_PRODUCT_IMAGE_VARIANT_BYTES)) {
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
