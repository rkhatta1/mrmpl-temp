export type GeneratedImageMetadata = {
  blurDataURL: string;
  height: number;
  width: number;
};

type BunFileFactory = (filePath: string) => ReturnType<typeof Bun.file>;

async function createBunPlaceholder(file: ReturnType<typeof Bun.file>) {
  const image = file.image();
  const metadata = await image.metadata();
  const placeholder = await image.placeholder();
  const placeholderBlob = await (await fetch(placeholder)).blob();

  return {
    blurDataURL: await placeholderBlob.image().webp({ quality: 20 }).dataurl(),
    height: metadata.height,
    width: metadata.width,
  } satisfies GeneratedImageMetadata;
}

async function createSharpPlaceholder(filePath: string) {
  const { default: sharp } = await import("sharp");
  const image = sharp(filePath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions from " + filePath);
  }

  const placeholder = await image
    .resize({
      fit: "inside",
      height: 16,
      width: 16,
      withoutEnlargement: true,
    })
    .webp({ quality: 20 })
    .toBuffer();

  return {
    blurDataURL: "data:image/webp;base64," + placeholder.toString("base64"),
    height: metadata.height,
    width: metadata.width,
  } satisfies GeneratedImageMetadata;
}

export async function createPlaceholder(
  filePath: string,
  fileForPath: BunFileFactory = Bun.file,
) {
  const file = fileForPath(filePath);

  return typeof file.image === "function"
    ? createBunPlaceholder(file)
    : createSharpPlaceholder(filePath);
}
