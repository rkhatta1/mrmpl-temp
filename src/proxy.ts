import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getAdminLoginPath,
  isAdminHostname,
} from "@/lib/admin-routing";

function isAdminLoginPath(pathname: string, isAdminHost: boolean) {
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return true;
  }

  return isAdminHost && (pathname === "/login" || pathname.startsWith("/login/"));
}

function isProtectedAdminPath(pathname: string, isAdminHost: boolean) {
  if (isAdminLoginPath(pathname, isAdminHost)) {
    return false;
  }

  if (isAdminHost) {
    return true;
  }

  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  const isAdminHost = isAdminHostname(host);
  const { pathname } = request.nextUrl;

  // Optimistic cookie gate only — real session validation lives in the
  // admin workspace layout via isAuthenticated() / Better Auth session APIs.
  if (isProtectedAdminPath(pathname, isAdminHost)) {
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = getAdminLoginPath(host);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (!isAdminHost) {
    return NextResponse.next();
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;

  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
