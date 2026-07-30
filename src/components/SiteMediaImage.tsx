"use client";

import type { ImgHTMLAttributes } from "react";

import { useSiteMediaUrl } from "@/contexts/SiteMediaContext";

type SiteMediaImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src"
> & {
  src?: string;
};

export default function SiteMediaImage({
  alt = "",
  src,
  ...props
}: SiteMediaImageProps) {
  const resolvedSrc = useSiteMediaUrl(src);
  return <img alt={alt} src={resolvedSrc} {...props} />;
}
