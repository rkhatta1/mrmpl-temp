import type { Metadata } from "next";

import { SiteMediaManager } from "@/components/admin/site-media-manager";

export const metadata: Metadata = {
  title: "Site media",
};

export default function AdminSiteMediaPage() {
  return <SiteMediaManager />;
}
