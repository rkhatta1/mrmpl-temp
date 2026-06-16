import SiteShell from "../site-shell";
import Home from "@/features/site/pages/Home";

export default function LogoPage() {
  return (
    <SiteShell headerLogoSrc="/mrmpl-full-green.svg" headerLogoClassName="h-12 w-auto">
      <Home />
    </SiteShell>
  );
}
