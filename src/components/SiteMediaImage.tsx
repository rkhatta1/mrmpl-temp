"use client";

import type { ImgHTMLAttributes } from "react";

import LazyImage from "@/components/LazyImage";
import { getSiteImageMetadata } from "@/generated/site-image-placeholders";

type SiteMediaImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src"
> & {
  src?: string;
};

export default function SiteMediaImage({
  alt = "",
  loading,
  src,
  ...props
}: SiteMediaImageProps) {
  const metadata = getSiteImageMetadata(src);

  return (
    <LazyImage
      alt={alt}
      blurDataURL={metadata?.blurDataURL}
      eager={loading === "eager"}
      height={metadata?.height}
      src={src}
      width={metadata?.width}
      {...props}
    />
  );
}
