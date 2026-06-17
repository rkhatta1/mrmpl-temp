"use client";

import { Toaster } from "react-hot-toast";
import { Suspense } from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import BrandThemeWidget from "@/components/BrandThemeWidget";
import { CompareProvider } from "@/contexts/CompareContext";

type SiteShellProps = {
  children: React.ReactNode;
  headerLogoSrc?: string;
  headerLogoClassName?: string;
};

export default function SiteShell({
  children,
  headerLogoSrc,
  headerLogoClassName,
}: SiteShellProps) {
  return (
    <CompareProvider>
      <Suspense fallback={null}>
        <ScrollToTop />
        <div className="min-h-screen">
          <Header logoSrc={headerLogoSrc} logoClassName={headerLogoClassName} />
          <main>{children}</main>
          <Footer />
          <BrandThemeWidget />
        </div>
        <Toaster position="top-right" />
      </Suspense>
    </CompareProvider>
  );
}
