const MAX_IMAGE_EDGE = 2400;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const OPTIMIZED_IMAGE_TYPES = new Set(["image/avif", "image/webp"]);
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type SiteMediaImagePlan = {
  height: number;
  shouldTranscode: boolean;
  width: number;
};

export function getSiteMediaImagePlan({
  height,
  mimeType,
  size,
  width,
}: {
  height: number;
  mimeType: string;
  size: number;
  width: number;
}): SiteMediaImagePlan {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error("Could not read the image dimensions.");
  }

  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
  const nextWidth = Math.max(1, Math.round(width * scale));
  const nextHeight = Math.max(1, Math.round(height * scale));
  const alreadyOptimized = OPTIMIZED_IMAGE_TYPES.has(mimeType);

  return {
    width: nextWidth,
    height: nextHeight,
    shouldTranscode:
      !alreadyOptimized || scale < 1 || size > MAX_UPLOAD_BYTES,
  };
}

function toWebpFilename(name: string) {
  const base = name.replace(/\.[^.]+$/, "").trim() || "site-media";
  return `${base}.webp`;
}

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

export async function optimizeSiteMediaImage(file: File) {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Choose a PNG, JPEG, WebP, or AVIF image.");
  }
  if (file.size <= 0 || file.size > MAX_SOURCE_BYTES) {
    throw new Error("Choose an image smaller than 25 MB.");
  }

  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });

  try {
    const plan = getSiteMediaImagePlan({
      width: bitmap.width,
      height: bitmap.height,
      mimeType: file.type,
      size: file.size,
    });

    if (!plan.shouldTranscode) {
      return { file, width: plan.width, height: plan.height };
    }

    const canvas = document.createElement("canvas");
    canvas.width = plan.width;
    canvas.height = plan.height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("The browser could not optimize this image.");

    context.drawImage(bitmap, 0, 0, plan.width, plan.height);
    let blob = await canvasToWebp(canvas, 0.84);
    if (blob.size > MAX_UPLOAD_BYTES) {
      blob = await canvasToWebp(canvas, 0.72);
    }
    if (blob.size > MAX_UPLOAD_BYTES) {
      throw new Error("The optimized image is still larger than 8 MB.");
    }

    return {
      file: new File([blob], toWebpFilename(file.name), {
        lastModified: Date.now(),
        type: "image/webp",
      }),
      width: plan.width,
      height: plan.height,
    };
  } finally {
    bitmap.close();
  }
}
