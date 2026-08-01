import { Toaster } from "react-hot-toast";
import { Suspense } from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SitePageLoading from "@/components/SitePageLoading";
import ScrollToTop from "@/components/ScrollToTop";
import { CompareProvider } from "@/contexts/CompareContext";
import { SiteMediaProvider } from "@/contexts/SiteMediaContext";
import { getSiteMediaOverrides } from "@/lib/site-media-server";
import type { SiteMediaPageId } from "@/lib/site-media-registry";

type SiteShellProps = {
  children: React.ReactNode;
  mediaPage?: SiteMediaPageId;
};

async function SiteMediaContent({
  children,
  mediaPage,
}: SiteShellProps) {
  const mediaOverrides = mediaPage
    ? await getSiteMediaOverrides(mediaPage)
    : [];

  return (
    <SiteMediaProvider overrides={mediaOverrides}>
      <main>{children}</main>
    </SiteMediaProvider>
  );
}

export default function SiteShell({ children, mediaPage }: SiteShellProps) {
  return (
    <CompareProvider>
      <Suspense fallback={null}>
        <ScrollToTop />
      </Suspense>
      <div className="min-h-screen">
        <Header />
        <Suspense fallback={<SitePageLoading />}>
          <SiteMediaContent mediaPage={mediaPage}>
            {children}
          </SiteMediaContent>
        </Suspense>
        <Footer />
      </div>
      <Toaster position="top-right" />
    </CompareProvider>
  );
}
