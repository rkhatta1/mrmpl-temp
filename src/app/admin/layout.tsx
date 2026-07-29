import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminPageTransition } from "@/components/admin/page-transition";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | MRMPL Admin",
  },
  description: "Administration workspace for the MRMPL website.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <AdminPageTransition>{children}</AdminPageTransition>;
}
