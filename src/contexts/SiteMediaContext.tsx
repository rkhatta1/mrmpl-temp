"use client";

import { createContext, useContext } from "react";

import {
  resolveSiteMediaUrl,
  type SiteMediaOverride,
} from "@/lib/site-media-registry";

const SiteMediaContext = createContext<SiteMediaOverride[]>([]);

export function SiteMediaProvider({
  children,
  overrides,
}: {
  children: React.ReactNode;
  overrides: SiteMediaOverride[];
}) {
  return (
    <SiteMediaContext.Provider value={overrides}>
      {children}
    </SiteMediaContext.Provider>
  );
}

export function useSiteMediaUrl(defaultSrc: string | undefined) {
  const overrides = useContext(SiteMediaContext);
  return defaultSrc ? resolveSiteMediaUrl(defaultSrc, overrides) : defaultSrc;
}
