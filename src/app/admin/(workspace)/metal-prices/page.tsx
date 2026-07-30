import type { Metadata } from "next";

import { MetalPricesEditor } from "@/components/admin/metal-prices-editor";

export const metadata: Metadata = {
  title: "Metal prices",
};

export default function AdminMetalPricesPage() {
  return <MetalPricesEditor />;
}
