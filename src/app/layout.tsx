import type { Metadata } from "next";
import type { ReactNode } from "react";

import ConvexClientProvider from "@/components/ConvexClientProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mayank Raw Mint Pvt. Ltd.",
  description: "Manufacturer and exporter of precision brass fittings and engineered components.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
