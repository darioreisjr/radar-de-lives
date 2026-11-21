import { HeroSection } from "@/components/hero/hero-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LiveExplorer } from "@/components/lives/live-explorer";

export default function Home() {
  // Dados simulados só fora de produção (D15).
  const demoAllowed = process.env.NODE_ENV !== "production";

  return (
    <>
      <a
        href="#lives"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent-pink focus:px-4 focus:py-2 focus:text-background"
      >
        Pular para as lives
      </a>
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <LiveExplorer demoAllowed={demoAllowed} />
      </main>
      <SiteFooter />
    </>
  );
}
