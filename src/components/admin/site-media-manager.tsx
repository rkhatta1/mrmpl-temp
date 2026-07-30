"use client";

import { useQuery } from "convex/react";
import {
  ImageIcon,
  LoaderCircle,
  LockKeyhole,
  Upload,
  Video,
} from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

import { api } from "../../../convex/_generated/api";
import { AnimatedBackground } from "@/components/motion-primitives/animated-background";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/shadcn-aspect-ratio";
import { Button } from "@/components/ui/shadcn-button";
import { Separator } from "@/components/ui/shadcn-separator";
import { optimizeSiteMediaImage } from "@/lib/site-media-image";
import {
  getSiteMediaGridPlacement,
  getSiteMediaPage,
  resolveSiteMediaUrl,
  SITE_MEDIA_PAGES,
  type SiteMediaAsset,
  type SiteMediaPageId,
} from "@/lib/site-media-registry";
import { useUploadThing } from "@/lib/uploadthing-client";

type UploadResponse = {
  error?: string;
  ok?: boolean;
};

function MediaPreview({
  asset,
  overrides,
}: {
  asset: SiteMediaAsset;
  overrides: Array<{
    assetId: string;
    height: number;
    url: string;
    width: number;
  }>;
}) {
  const override = overrides.find((item) => item.assetId === asset.id);
  const width = override?.width ?? asset.width;
  const height = override?.height ?? asset.height;
  const { ratio } = getSiteMediaGridPlacement(width, height);

  return (
    <AspectRatio
      ratio={ratio}
      className="overflow-hidden rounded-xl bg-muted/50"
    >
      {asset.kind === "video" ? (
        <video
          className="size-full object-cover"
          controls
          muted
          playsInline
          poster={asset.posterSrc}
          preload="metadata"
          src={asset.defaultSrc}
        />
      ) : (
        <img
          alt={asset.label}
          className="size-full object-cover"
          decoding="async"
          loading="lazy"
          src={resolveSiteMediaUrl(asset.defaultSrc, overrides)}
        />
      )}
    </AspectRatio>
  );
}

export function SiteMediaManager() {
  const [selectedPageId, setSelectedPageId] =
    useState<SiteMediaPageId>("home");
  const [pendingAsset, setPendingAsset] = useState<SiteMediaAsset | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedPage = getSiteMediaPage(selectedPageId);
  const overrides = useQuery(api.siteMedia.listAdminByPage, {
    page: selectedPageId,
  });
  const { startUpload, isUploading } = useUploadThing("siteMediaImage", {
    onUploadProgress: setUploadProgress,
  });

  function chooseReplacement(asset: SiteMediaAsset) {
    if (!asset.mutable || asset.kind !== "image" || isUploading) return;
    setPendingAsset(asset);
    fileInputRef.current?.click();
  }

  async function replaceImage(file: File, asset: SiteMediaAsset) {
    if (!file.type.startsWith("image/")) {
      throw new Error("Choose an image file for this image placement.");
    }

    const optimized = await optimizeSiteMediaImage(file);
    const uploadedFiles = await startUpload([optimized.file]);
    const uploaded = uploadedFiles?.[0];
    if (!uploaded?.serverData) {
      throw new Error("The image upload did not finish.");
    }

    const response = await fetch("/api/admin/site-media/replace", {
      body: JSON.stringify({
        assetId: asset.id,
        fileKey: uploaded.serverData.fileKey,
        height: optimized.height,
        mimeType: uploaded.serverData.mimeType,
        page: asset.pageId,
        size: uploaded.serverData.size,
        url: uploaded.serverData.url,
        width: optimized.width,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as UploadResponse;
    if (!response.ok) {
      throw new Error(result.error ?? "Could not replace the image.");
    }
  }

  async function handleFileSelection(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    const asset = pendingAsset;
    event.target.value = "";
    if (!file || !asset) return;

    try {
      await replaceImage(file, asset);
      toast.success(`${asset.label} updated.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not replace the image.",
      );
    } finally {
      setPendingAsset(null);
      setUploadProgress(0);
    }
  }

  if (!selectedPage) return null;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden pb-0">
      <div className="max-w-3xl">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance md:text-3xl">
          Site media
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Replace images used across the static website. Videos are shown for
          context and remain read-only.
        </p>
      </div>

      <input
        ref={fileInputRef}
        accept="image/avif,image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileSelection}
        type="file"
      />

      <div className="mt-8 grid min-h-0 min-w-0 flex-1 grid-rows-[auto_auto_minmax(0,1fr)] gap-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:grid-rows-1 lg:gap-9">
        <aside
          aria-label="Website pages"
          className="relative min-w-0 lg:sticky lg:top-0 lg:self-start"
        >
          <div className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            <AnimatedBackground
              className="rounded-md bg-muted"
              defaultValue={selectedPageId}
              onValueChange={(value) => {
                if (value) setSelectedPageId(value as SiteMediaPageId);
              }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {SITE_MEDIA_PAGES.map((page) => (
                <button
                  key={page.id}
                  className="shrink-0 cursor-pointer rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors data-[checked=true]:text-foreground lg:w-full"
                  data-id={page.id}
                  type="button"
                >
                  {page.label}
                </button>
              ))}
            </AnimatedBackground>
          </div>
          <Separator
            className="absolute top-0 -right-3.5 hidden h-full lg:block"
            orientation="vertical"
          />
        </aside>

        <Separator className="lg:hidden" />

        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="mb-5 flex shrink-0 items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">{selectedPage.label}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedPage.assets.length} media placement
                {selectedPage.assets.length === 1 ? "" : "s"}
              </p>
            </div>
            {pendingAsset ? (
              <p className="text-xs text-muted-foreground" aria-live="polite">
                Optimizing and uploading {Math.round(uploadProgress)}%
              </p>
            ) : null}
          </div>

          <ScrollArea className="-mr-3 min-h-0 flex-1 pr-3">
            {overrides === undefined ? (
              <div className="columns-1 gap-5 sm:columns-2 2xl:columns-3">
                {selectedPage.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="mb-6 aspect-[4/3] break-inside-avoid animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            ) : (
              <div className="columns-1 gap-5 sm:columns-2 2xl:columns-3 pb-20">
                {selectedPage.assets.map((asset) => {
                  const isPending = pendingAsset?.id === asset.id;

                  return (
                    <figure key={asset.id} className="mb-7 break-inside-avoid">
                      <div className="relative">
                        <MediaPreview asset={asset} overrides={overrides} />
                        {isPending ? (
                          <div className="absolute inset-0 grid place-items-center rounded-xl bg-background/70 backdrop-blur-[2px]">
                            <LoaderCircle className="size-5 animate-spin" />
                          </div>
                        ) : null}
                      </div>

                      <figcaption className="mt-2.5 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          {asset.kind === "video" ? (
                            <Video className="size-3.5 shrink-0 text-muted-foreground" />
                          ) : (
                            <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <span className="truncate text-sm font-medium">
                            {asset.label}
                          </span>
                        </div>

                        {asset.mutable && asset.kind === "image" ? (
                          <Button
                            disabled={isUploading}
                            onClick={() => chooseReplacement(asset)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Upload data-icon="inline-start" />
                            Change
                          </Button>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                            <LockKeyhole className="size-3" />
                            Read only
                          </span>
                        )}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </section>
  );
}
