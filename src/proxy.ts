import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isAdminHostname } from "@/lib/admin-routing";

export function proxy(request: NextRequest) {
  if (!isAdminHostname(request.headers.get("host"))) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

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
