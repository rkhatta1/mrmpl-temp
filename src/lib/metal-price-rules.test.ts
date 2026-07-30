import { describe, expect, test } from "bun:test";

import {
  MAX_METAL_PRICES,
  getMetalDraftError,
  normalizeMetalSymbolInput,
} from "./metal-price-rules";

describe("metal price editor rules", () => {
  test("uppercases symbols and limits input to two characters", () => {
    expect(normalizeMetalSymbolInput(" cu ")).toBe("CU");
    expect(normalizeMetalSymbolInput("cuz")).toBe("CU");
  });

  test("accepts a complete unique metal draft", () => {
    expect(
      getMetalDraftError(
        { id: "new-copper", name: " Copper ", symbol: "cu", price: "9250.5" },
        [{ id: "aluminium", name: "Aluminium", symbol: "AL" }],
      ),
    ).toBeNull();
  });

  test("rejects duplicate names and symbols case-insensitively", () => {
    const existing = [{ id: "copper", name: "Copper", symbol: "CU" }];

    expect(
      getMetalDraftError(
        { id: "new-copper", name: " copper ", symbol: "CP", price: "1" },
        existing,
      ),
    ).toBe("Copper is already in the list.");
    expect(
      getMetalDraftError(
        { id: "new-brass", name: "Brass", symbol: "cu", price: "1" },
        existing,
      ),
    ).toBe("The symbol CU is already in use.");
  });

  test("allows an existing row to keep its own name and symbol", () => {
    expect(
      getMetalDraftError(
        { id: "copper", name: "Copper", symbol: "CU", price: "9250.5" },
        [{ id: "copper", name: "Copper", symbol: "CU" }],
      ),
    ).toBeNull();
  });

  test("requires a name, symbol, and positive finite price", () => {
    expect(
      getMetalDraftError({ id: "new", name: "", symbol: "CU", price: "1" }, []),
    ).toBe("Enter a metal name.");
    expect(
      getMetalDraftError(
        { id: "new", name: "Copper", symbol: "", price: "1" },
        [],
      ),
    ).toBe("Enter a metal symbol.");
    expect(
      getMetalDraftError(
        { id: "new", name: "Copper", symbol: "CU", price: "0" },
        [],
      ),
    ).toBe("Enter a price greater than zero.");
  });

  test("caps the editor at six metals", () => {
    expect(MAX_METAL_PRICES).toBe(6);
  });
});
