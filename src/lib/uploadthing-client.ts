import { generateReactHelpers } from "@uploadthing/react";

import type { SiteMediaFileRouter } from "@/app/api/uploadthing/core";

export const { useUploadThing } =
  generateReactHelpers<SiteMediaFileRouter>();
