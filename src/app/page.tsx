import SiteShell from "./site-shell";
import Home from "@/features/site/pages/Home";

export default function Page() {
  return (
    <SiteShell mediaPage="home">
      <Home />
    </SiteShell>
  );
}
