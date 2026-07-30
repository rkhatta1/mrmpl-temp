import { describe, expect, test } from "bun:test";

import { MAX_METAL_PRICES, getMetalDraftError } from "./metal-price-rules";

describe("metal price editor rules", () => {
  test("accepts a complete selection whose price comes from Convex", () => {
    expect(
      getMetalDraftError(
        {
          id: "new-copper",
          apiCode: "copper",
          name: "Copper",
          symbol: "CU",
          price: "9250.5",
        },
        [],
      ),
    ).toBeNull();
  });

  test("requires a catalogue selection and rejects a duplicate metal", () => {
    expect(
      getMetalDraftError(
        { id: "new", apiCode: "", name: "", symbol: "", price: "" },
        [],
      ),
    ).toBe("Choose a metal from the list.");

    expect(
      getMetalDraftError(
        {
          id: "new-copper",
          apiCode: "copper",
          name: "Copper",
          symbol: "CU",
          price: "9250.5",
        },
        [
          {
            id: "copper",
            apiCode: "copper",
            name: "Copper",
            symbol: "CU",
          },
        ],
      ),
    ).toBe("Copper is already in the list.");
  });

  test("caps the editor at six metals", () => {
    expect(MAX_METAL_PRICES).toBe(6);
  });
});
