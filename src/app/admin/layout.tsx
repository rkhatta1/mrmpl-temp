import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminBasePath } from "@/lib/admin-routing";

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

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  return (
    <AdminShell basePath={getAdminBasePath(host)}>{children}</AdminShell>
  );
}
