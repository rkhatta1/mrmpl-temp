import {
  MAX_PRODUCT_IMAGE_VARIANT_BYTES,
  getProductImageVariantDescriptors,
  type ProductImageVariantDescriptor,
} from "./product-image-contract";

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MIN_WEBP_QUALITY = 0.05;
const MAX_WEBP_QUALITY = 0.84;
const QUALITY_SEARCH_STEPS = 7;
const RESIZE_FACTOR = 0.85;
const MAX_RESIZE_ATTEMPTS = 10;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type OptimizedProductImageVariant = ProductImageVariantDescriptor & {
  file: File;
};

function canvasToWebp(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The browser could not optimize this image."));
      },
      "image/webp",
      quality,
    );
  });
}

async function encodeWithinLimit(canvas: HTMLCanvasElement) {
  let lowerQuality = MIN_WEBP_QUALITY;
  let upperQuality = MAX_WEBP_QUALITY;
  let best = await canvasToWebp(canvas, lowerQuality);
  if (best.size > MAX_PRODUCT_IMAGE_VARIANT_BYTES) return null;

  for (let step = 0; step < QUALITY_SEARCH_STEPS; step += 1) {
    const quality = (lowerQuality + upperQuality) / 2;
    const candidate = await canvasToWebp(canvas, quality);
    if (candidate.size <= MAX_PRODUCT_IMAGE_VARIANT_BYTES) {
      best = candidate;
      lowerQuality = quality;
    } else {
      upperQuality = quality;
    }
  }

  return best;
}

async function createVariant(
  bitmap: ImageBitmap,
  descriptor: ProductImageVariantDescriptor,
) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) throw new Error("The browser could not optimize this image.");

  let width = descriptor.width;
  let height = descriptor.height;

  for (let attempt = 0; attempt <= MAX_RESIZE_ATTEMPTS; attempt += 1) {
    canvas.width = width;
    canvas.height = height;
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await encodeWithinLimit(canvas);
    if (blob) {
      return {
        ...descriptor,
        file: new File([blob], descriptor.fileName, {
          lastModified: Date.now(),
          type: "image/webp",
        }),
        height,
        width,
      };
    }

    width = Math.max(1, Math.floor(width * RESIZE_FACTOR));
    height = Math.max(1, Math.round((bitmap.height / bitmap.width) * width));
  }

  throw new Error(
    `The ${descriptor.targetWidth}px image variant could not be compressed below 50 KB.`,
  );
}

export async function optimizeProductImageVariants(
  file: File,
  {
    mediaId,
    partCode,
  }: {
    mediaId: string;
    partCode: unknown;
  },
) {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Choose a PNG, JPEG, WebP, or AVIF image.");
  }
  if (file.size <= 0 || file.size > MAX_SOURCE_BYTES) {
    throw new Error("Choose a source image smaller than 25 MB.");
  }

  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });

  try {
    const descriptors = getProductImageVariantDescriptors({
      height: bitmap.height,
      mediaId,
      partCode,
      width: bitmap.width,
    });
    const variants: OptimizedProductImageVariant[] = [];

    for (const descriptor of descriptors) {
      variants.push(await createVariant(bitmap, descriptor));
    }

    return variants;
  } finally {
    bitmap.close();
  }
}
