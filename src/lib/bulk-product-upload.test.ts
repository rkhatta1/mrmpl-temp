import { describe, expect, test } from "bun:test";

import {
  BULK_PRODUCT_HEADERS,
  parseBulkProductSheet,
} from "./bulk-product-upload";

function row(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = {
    product_name: "Fixture valve",
    part_code: "FIX-001",
    category: "Valves",
    subcategory: "Ball valves",
    size: "1/2 in",
    material: "SS 316",
    type: "Valve",
    finish_plating: "Natural",
    thread_standard: "NPT",
    sealant: "PTFE",
    temperature: "180 C",
    pressure: "1500 PSI",
    connections: "Threaded",
    assemblies: "Body; stem",
    grade: "AISI 316",
    description: "Fixture",
    applications: "Chemical; Oil & gas",
    certifications: "ISO 9001",
    additional_notes: "Local test",
    dimensions: "A=20 mm|Overall length",
    photo_codes: "photo-a; PHOTO-B",
    is_active: true,
    ...overrides,
  };
  return BULK_PRODUCT_HEADERS.map((header) => values[header]);
}

describe("bulk product workbook parser", () => {
  test("parses template rows and normalizes reusable photo codes", () => {
    const result = parseBulkProductSheet([
      [...BULK_PRODUCT_HEADERS],
      row(),
      row({ part_code: "FIX-002", product_name: "Second valve" }),
    ]);

    expect(result.issues).toEqual([]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      photoCodes: ["PHOTO-A", "PHOTO-B"],
      dimensions: [{ parameter: "A", value: "20 mm", notes: "Overall length" }],
      isActive: true,
    });
  });

  test("reports normalized duplicate part codes", () => {
    const result = parseBulkProductSheet([
      [...BULK_PRODUCT_HEADERS],
      row(),
      row({ part_code: "fix-001" }),
    ]);

    expect(result.issues).toContainEqual({
      row: 3,
      column: "part_code",
      message: "Duplicate part_code; first used on row 2.",
    });
  });
});
