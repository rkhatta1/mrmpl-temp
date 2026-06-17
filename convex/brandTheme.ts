import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const GLOBAL_THEME_KEY = "global";

const themeValues = v.object({
  primaryText: v.string(),
  secondaryText: v.string(),
  primaryAccent: v.string(),
  surfaceTint: v.string(),
  buttonPrimary: v.string(),
  buttonHover: v.string(),
  footerStart: v.string(),
  footerEnd: v.string(),
});

type ThemeValues = {
  primaryText: string;
  secondaryText: string;
  primaryAccent: string;
  surfaceTint: string;
  buttonPrimary: string;
  buttonHover: string;
  footerStart: string;
  footerEnd: string;
};

function normalizeHex(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid theme color: ${value}`);
  }
  return normalized;
}

function normalizeTheme(values: ThemeValues): ThemeValues {
  return {
    primaryText: normalizeHex(values.primaryText),
    secondaryText: normalizeHex(values.secondaryText),
    primaryAccent: normalizeHex(values.primaryAccent),
    surfaceTint: normalizeHex(values.surfaceTint),
    buttonPrimary: normalizeHex(values.buttonPrimary),
    buttonHover: normalizeHex(values.buttonHover),
    footerStart: normalizeHex(values.footerStart),
    footerEnd: normalizeHex(values.footerEnd),
  };
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("brandThemeSettings")
      .withIndex("by_key", (q) => q.eq("key", GLOBAL_THEME_KEY))
      .first();
  },
});

export const apply = mutation({
  args: {
    values: themeValues,
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const values = normalizeTheme(args.values);
    const existing = await ctx.db
      .query("brandThemeSettings")
      .withIndex("by_key", (q) => q.eq("key", GLOBAL_THEME_KEY))
      .first();

    const doc = {
      key: GLOBAL_THEME_KEY,
      values,
      updatedAt: now,
      updatedBy: args.updatedBy?.trim() || "brand-theme-widget",
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return { ...existing, ...doc };
    }

    const id = await ctx.db.insert("brandThemeSettings", doc);
    return { _id: id, ...doc };
  },
});
