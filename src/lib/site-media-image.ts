import {
  MAX_SITE_MEDIA_IMAGE_VARIANT_BYTES,
  getSiteMediaImageVariantDescriptors,
} from "./site-media-image-contract";
import { optimizeResponsiveImageVariants } from "./product-image-optimizer";

export async function optimizeSiteMediaImageVariants(
  file: File,
  { mediaId }: { mediaId: string },
) {
  return optimizeResponsiveImageVariants(file, {
    getDescriptors: ({ height, width }) =>
      getSiteMediaImageVariantDescriptors({
        height,
        mediaId,
        width,
      }),
    maxBytes: MAX_SITE_MEDIA_IMAGE_VARIANT_BYTES,
  });
}
