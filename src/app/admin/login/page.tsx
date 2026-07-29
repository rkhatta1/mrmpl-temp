import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminLoginFlow } from "@/components/admin/login-flow";
import { hasAdminAccessGate } from "@/lib/admin-access";
import { getAdminHomePath } from "@/lib/admin-routing";
import { isAuthenticated } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Sign in",
};

function getPublicSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export default async function AdminLoginPage() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const redirectTo = getAdminHomePath(host);

  if (await isAuthenticated()) {
    redirect(redirectTo);
  }

  return (
    <AdminLoginFlow
      hasAccess={await hasAdminAccessGate()}
      homeHref={getPublicSiteUrl()}
      redirectTo={redirectTo}
    />
  );
}
