import { unstable_cache } from "next/cache";

import { api, getConvexHttpClient } from "@/lib/convex-server";
import type {
  SiteMediaOverride,
  SiteMediaPageId,
} from "@/lib/site-media-registry";

const getCachedSiteMediaOverrides = unstable_cache(
  async (page: SiteMediaPageId): Promise<SiteMediaOverride[]> => {
    const client = getConvexHttpClient();
    if (!client) return [];

    try {
      return await client.query(api.siteMedia.listPublicByPage, { page });
    } catch {
      return [];
    }
  },
  ["site-media-overrides"],
  {
    revalidate: 300,
    tags: ["site-media"],
  },
);

export function getSiteMediaOverrides(page: SiteMediaPageId) {
  return getCachedSiteMediaOverrides(page);
}
