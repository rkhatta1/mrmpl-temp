import { Toaster } from "react-hot-toast";
import { Suspense } from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { CompareProvider } from "@/contexts/CompareContext";
import { SiteMediaProvider } from "@/contexts/SiteMediaContext";
import { getSiteMediaOverrides } from "@/lib/site-media-server";
import type { SiteMediaPageId } from "@/lib/site-media-registry";

type SiteShellProps = {
  children: React.ReactNode;
  mediaPage?: SiteMediaPageId;
};

export default async function SiteShell({
  children,
  mediaPage,
}: SiteShellProps) {
  const mediaOverrides = mediaPage
    ? await getSiteMediaOverrides(mediaPage)
    : [];

  return (
    <SiteMediaProvider overrides={mediaOverrides}>
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
    </SiteMediaProvider>
  );
}
