import { describe, expect, test } from "bun:test";

import { brandThemeToCssVars, DEFAULT_BRAND_THEME, normalizeBrandTheme } from "./brand-theme";

describe("brand theme", () => {
  test("normalizes valid role colors and falls back for invalid values", () => {
    const theme = normalizeBrandTheme({
      ...DEFAULT_BRAND_THEME,
      buttonPrimary: "#abcdef",
      buttonHover: "red",
    });

    expect(theme.buttonPrimary).toBe("#ABCDEF");
    expect(theme.buttonHover).toBe(DEFAULT_BRAND_THEME.buttonHover);
  });

  test("serializes theme roles into CSS variables", () => {
    const vars = brandThemeToCssVars(DEFAULT_BRAND_THEME);

    expect(vars["--mrm-button-primary"]).toBe(DEFAULT_BRAND_THEME.buttonPrimary);
    expect(vars["--mrm-footer-end"]).toBe(DEFAULT_BRAND_THEME.footerEnd);
  });
});
