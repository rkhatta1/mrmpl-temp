"use client";

import { Toaster } from "react-hot-toast";
import { Suspense } from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { CompareProvider } from "@/contexts/CompareContext";

type SiteShellProps = {
  children: React.ReactNode;
};

export default function SiteShell({ children }: SiteShellProps) {
  return (
    <CompareProvider>
      <Suspense fallback={null}>
        <ScrollToTop />
        <div className="min-h-screen">
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
        <Toaster position="top-right" />
      </Suspense>
    </CompareProvider>
  );
}
