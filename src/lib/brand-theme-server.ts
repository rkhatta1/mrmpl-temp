import { DEFAULT_BRAND_THEME, normalizeBrandTheme } from "@/lib/brand-theme";
import { api, getConvexHttpClient } from "@/lib/convex-server";

export async function getGlobalBrandTheme() {
  const convex = getConvexHttpClient();
  if (!convex) return DEFAULT_BRAND_THEME;

  try {
    const result = await convex.query(api.brandTheme.get, {});
    return normalizeBrandTheme(result?.values);
  } catch (error) {
    console.warn("Convex brand theme query failed, falling back to default theme.", error);
    return DEFAULT_BRAND_THEME;
  }
}
