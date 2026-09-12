import { genUploader } from "uploadthing/client";
import type { SiteMediaFileRouter } from "@/app/api/uploadthing/core";

export const { uploadFiles: uploadBulkProductFiles } =
  genUploader<SiteMediaFileRouter>();

/** Two source images at a time; drain both workers before releasing the attempt. */
export async function mapImportPhotos<Value, Result>(
  values: readonly Value[],
  signal: AbortSignal,
  work: (value: Value, index: number) => Promise<Result>,
) {
  const results: Result[] = new Array(values.length);
  let next = 0;
  let failed = false;
  const worker = async () => {
    while (!failed && next < values.length) {
      signal.throwIfAborted();
      const index = next++;
      try {
        results[index] = await work(values[index], index);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };
  const settled = await Promise.allSettled([worker(), worker()]);
  const rejected = settled.find((result) => result.status === "rejected");
  if (rejected?.status === "rejected") throw rejected.reason;
  signal.throwIfAborted();
  return results;
}

export async function validateImportPhoto(file: File) {
  if (
    !["image/png", "image/jpeg", "image/webp", "image/avif"].includes(file.type)
  )
    throw new Error("Choose PNG, JPEG, WebP or AVIF.");
  if (!file.size || file.size > 25 * 1024 * 1024)
    throw new Error("Choose a nonempty image of at most 25 MiB.");
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    bitmap.close();
  } catch {
    throw new Error(
      "Image could not be decoded. Save a valid image and select it again.",
    );
  }
}
