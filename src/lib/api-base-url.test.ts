import { describe, expect, test } from "bun:test";
import { getPublicApiBaseUrl } from "./api-base-url";

describe("getPublicApiBaseUrl", () => {
  test("falls back to the local Next API instead of producing undefined URLs", () => {
    const original = process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(getPublicApiBaseUrl()).toBe("/api");

    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = original;
    }
  });
});
