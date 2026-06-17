import SiteShell from "../site-shell";
import Home from "@/features/site/pages/Home";

export default function LogoPage() {
  return (
    <SiteShell headerLogoSrc="/mrmpl-medium-green.svg" headerLogoClassName="h-8 w-auto">
      <Home />
    </SiteShell>
  );
}
