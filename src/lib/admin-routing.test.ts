import { describe, expect, test } from "bun:test";

import {
  getAdminBasePath,
  isAdminHostname,
  normalizeHostname,
} from "./admin-routing";

describe("admin hostname routing", () => {
  test("normalizes forwarded host values and ports", () => {
    expect(normalizeHostname(" Admin.Example.com:443, proxy.internal ")).toBe(
      "admin.example.com",
    );
  });

  test("recognizes admin subdomains and the local development hostname", () => {
    expect(isAdminHostname("admin.localhost:3000")).toBe(true);
    expect(isAdminHostname("admin.example.com")).toBe(true);
    expect(isAdminHostname("example.com")).toBe(false);
  });

  test("uses root-relative links only on an admin hostname", () => {
    expect(getAdminBasePath("admin.example.com")).toBe("");
    expect(getAdminBasePath("localhost:3000")).toBe("/admin");
  });
});
