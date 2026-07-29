import { describe, expect, test } from "bun:test";

import {
  decryptAccessCode,
  encryptAccessCode,
  timingSafeEqualString,
} from "../../convex/lib/accessCodeCrypto";
import {
  createAdminAccessToken,
  isValidAdminAccessToken,
} from "./admin-access";

describe("admin access gate", () => {
  test("encrypts and decrypts access codes with the shared secret", async () => {
    const secret = "test-secret-at-least-32-characters!!";
    const encrypted = await encryptAccessCode("MRHIA361120", secret);

    expect(encrypted.includes("MRHIA361120")).toBe(false);
    expect(await decryptAccessCode(encrypted, secret)).toBe("MRHIA361120");
    expect(timingSafeEqualString("MRHIA361120", "MRHIA361120")).toBe(true);
    expect(timingSafeEqualString("MRHIA361120", "wrong")).toBe(false);
  });

  test("issues a verifiable access cookie token", () => {
    process.env.BETTER_AUTH_SECRET =
      process.env.BETTER_AUTH_SECRET ?? "test-secret-at-least-32-characters!!";

    const token = createAdminAccessToken();
    expect(isValidAdminAccessToken(token)).toBe(true);
    expect(isValidAdminAccessToken("forged")).toBe(false);
  });
});
