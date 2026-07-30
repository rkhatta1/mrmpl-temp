import { UploadThingError } from "uploadthing/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

import { isAuthenticated } from "@/lib/auth-server";

const f = createUploadthing();

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
} satisfies FileRouter;

export type SiteMediaFileRouter = typeof siteMediaFileRouter;
