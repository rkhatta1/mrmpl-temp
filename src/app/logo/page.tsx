import SiteShell from "../site-shell";
import Home from "@/features/site/pages/Home";

export default function LogoPage() {
  return (
    <SiteShell
      headerLogoSrc="/mrmpl-medium-green.svg"
      headerLogoClassName="h-auto w-auto"
      headerLogoStyle={{ width: "150px", maxHeight: "44px" }}
    >
      <Home />
    </SiteShell>
  );
}
