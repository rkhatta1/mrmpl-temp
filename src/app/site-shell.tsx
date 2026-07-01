"use client";

import { Toaster } from "react-hot-toast";
import { Suspense } from "react";
import type { CSSProperties } from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { CompareProvider } from "@/contexts/CompareContext";

type SiteShellProps = {
  children: React.ReactNode;
  headerLogoSrc?: string;
  headerLogoClassName?: string;
  headerLogoStyle?: CSSProperties;
};

export default function SiteShell({
  children,
  headerLogoSrc,
  headerLogoClassName,
  headerLogoStyle,
}: SiteShellProps) {
  return (
    <CompareProvider>
      <Suspense fallback={null}>
        <ScrollToTop />
        <div className="min-h-screen">
          <Header
            logoSrc={headerLogoSrc}
            logoClassName={headerLogoClassName}
            logoStyle={headerLogoStyle}
          />
          <main>{children}</main>
          <Footer />
        </div>
        <Toaster position="top-right" />
      </Suspense>
    </CompareProvider>
  );
}
