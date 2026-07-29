import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_ACCESS_COOKIE = "mrmpl_admin_access";

const GATE_PAYLOAD = "admin-access-granted";

function getAccessSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not configured.");
  }
  return secret;
}

export function createAdminAccessToken() {
  return createHmac("sha256", getAccessSecret())
    .update(GATE_PAYLOAD)
    .digest("base64url");
}

export function isValidAdminAccessToken(token: string | undefined) {
  if (!token) {
    return false;
  }

  const expected = createAdminAccessToken();
  const provided = Buffer.from(token);
  const target = Buffer.from(expected);

  if (provided.length !== target.length) {
    return false;
  }

  return timingSafeEqual(provided, target);
}

export async function hasAdminAccessGate() {
  const cookieStore = await cookies();
  return isValidAdminAccessToken(cookieStore.get(ADMIN_ACCESS_COOKIE)?.value);
}

export function getAdminAccessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}
