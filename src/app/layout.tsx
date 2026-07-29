import type { Metadata } from "next";
import { Montserrat, Outfit } from "next/font/google";
import type { ReactNode } from "react";

import ConvexClientProvider from "@/components/ConvexClientProvider";
import { getToken } from "@/lib/auth-server";
import { cn } from "@/lib/utils";
import "./globals.css";

const montserratHeading = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Mayank Raw Mint Pvt. Ltd.",
  description: "Manufacturer and exporter of precision brass fittings and engineered components.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const token = await getToken();

  return (
    <html
      lang="en"
      className={cn(
        "font-sans",
        outfit.variable,
        montserratHeading.variable,
      )}
    >
      <body suppressHydrationWarning>
        <ConvexClientProvider initialToken={token}>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
