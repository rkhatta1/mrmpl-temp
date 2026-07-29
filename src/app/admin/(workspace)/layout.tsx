import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import {
  getAdminBasePath,
  getAdminLoginPath,
} from "@/lib/admin-routing";
import { isAuthenticated } from "@/lib/auth-server";

export default async function AdminWorkspaceLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!(await isAuthenticated())) {
    redirect(getAdminLoginPath(host));
  }

  return (
    <AdminShell basePath={getAdminBasePath(host)}>{children}</AdminShell>
  );
}
