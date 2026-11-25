import { PolicyGate } from "@/components/consent/policy-gate";
import { HeroSection } from "@/components/hero/hero-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LiveExplorer } from "@/components/lives/live-explorer";
import { LivesProvider } from "@/components/lives/lives-provider";
import { getActivePlatforms } from "@/lib/lives/active-platforms";

export default function Home() {
  // Dados simulados só fora de produção (001 D15).
  const demoAllowed = process.env.NODE_ENV !== "production";
  // Plataformas ativas no servidor (spec 034): textos certos mesmo antes da API responder.
  const platforms = getActivePlatforms();

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
        {/* Estado das lives compartilhado entre o painel do radar e a grade (spec 007 D4). */}
        {/* Concordância com a política antes de buscar lives e carregar miniaturas (spec 016). */}
        <PolicyGate platforms={platforms}>
          <LivesProvider demoAllowed={demoAllowed} platforms={platforms}>
            <HeroSection />
            <LiveExplorer />
          </LivesProvider>
        </PolicyGate>
      </main>
      <SiteFooter />
    </>
  );
}
