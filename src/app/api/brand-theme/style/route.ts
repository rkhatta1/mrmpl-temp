import { brandThemeToCssVars } from "@/lib/brand-theme";
import { getGlobalBrandTheme } from "@/lib/brand-theme-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const values = await getGlobalBrandTheme();
  const declarations = Object.entries(brandThemeToCssVars(values))
    .map(([property, value]) => `${property}:${value}`)
    .join(";");

  return new Response(`:root{${declarations}}`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/css; charset=utf-8",
    },
  });
}
