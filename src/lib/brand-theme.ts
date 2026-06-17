export type ThemeRole =
  | "primaryText"
  | "secondaryText"
  | "primaryAccent"
  | "surfaceTint"
  | "buttonPrimary"
  | "buttonHover"
  | "footerStart"
  | "footerEnd";

export type ThemeValues = Record<ThemeRole, string>;

export const BRAND_THEME_STORAGE_KEY = "mrm-brand-theme";

export const DEFAULT_BRAND_THEME: ThemeValues = {
  primaryText: "#006937",
  secondaryText: "#4D4D4D",
  primaryAccent: "#006937",
  surfaceTint: "#F2F2F2",
  buttonPrimary: "#0D793D",
  buttonHover: "#103C1E",
  footerStart: "#083D1B",
  footerEnd: "#021D0D",
};

export const BRAND_THEME_ROLES: Array<{
  id: ThemeRole;
  label: string;
  cssVar: string;
}> = [
  { id: "primaryText", label: "Primary text", cssVar: "--mrm-primary-text" },
  { id: "secondaryText", label: "Secondary text", cssVar: "--mrm-secondary-text" },
  { id: "primaryAccent", label: "Primary accent", cssVar: "--mrm-primary-accent" },
  { id: "surfaceTint", label: "Surface tint", cssVar: "--mrm-surface-tint" },
  { id: "buttonPrimary", label: "Button primary", cssVar: "--mrm-button-primary" },
  { id: "buttonHover", label: "Button hover", cssVar: "--mrm-button-hover" },
  { id: "footerStart", label: "Footer start", cssVar: "--mrm-footer-start" },
  { id: "footerEnd", label: "Footer end", cssVar: "--mrm-footer-end" },
];

export function isThemeValues(value: unknown): value is ThemeValues {
  if (!value || typeof value !== "object") return false;

  return BRAND_THEME_ROLES.every((role) => {
    const candidate = (value as Partial<ThemeValues>)[role.id];
    return typeof candidate === "string" && /^#[0-9a-f]{6}$/i.test(candidate);
  });
}

export function normalizeBrandTheme(value: unknown): ThemeValues {
  if (!value || typeof value !== "object") return DEFAULT_BRAND_THEME;

  return BRAND_THEME_ROLES.reduce((theme, role) => {
    const candidate = (value as Partial<ThemeValues>)[role.id];
    theme[role.id] = typeof candidate === "string" && /^#[0-9a-f]{6}$/i.test(candidate)
      ? candidate.toUpperCase()
      : DEFAULT_BRAND_THEME[role.id];
    return theme;
  }, {} as ThemeValues);
}

export function brandThemeToCssVars(theme: ThemeValues) {
  return BRAND_THEME_ROLES.reduce<Record<string, string>>((vars, role) => {
    vars[role.cssVar] = theme[role.id];
    return vars;
  }, {});
}

export function applyBrandTheme(theme: ThemeValues) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  BRAND_THEME_ROLES.forEach((role) => {
    root.style.setProperty(role.cssVar, theme[role.id]);
  });
}
