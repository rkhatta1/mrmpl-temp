import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { api } from "../../../../../convex/_generated/api";
import {
  ADMIN_ACCESS_COOKIE,
  createAdminAccessToken,
  getAdminAccessCookieOptions,
} from "@/lib/admin-access";

export async function POST(request: Request) {
  let code = "";

  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    return NextResponse.json(
      { error: "Access code is required." },
      { status: 400 },
    );
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json(
      { error: "Convex is not configured." },
      { status: 500 },
    );
  }

  const convex = new ConvexHttpClient(convexUrl);
  const result = await convex.mutation(api.adminAccess.verifyAccessCode, {
    code,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Invalid access code." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    ADMIN_ACCESS_COOKIE,
    createAdminAccessToken(),
    getAdminAccessCookieOptions(),
  );

  return response;
}
