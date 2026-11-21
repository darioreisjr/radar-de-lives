import Link from "next/link";
import { RadarMark } from "@/components/ui/radar-mark";
import { siteConfig } from "@/lib/config/site";

export function SiteFooter() {
  return (
    <footer id="sobre" className="mt-auto border-t border-border/70 bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <RadarMark className="size-7" />
            <p className="font-display text-base font-semibold uppercase tracking-[0.12em]">{siteConfig.name}</p>
          </div>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-text-secondary">{siteConfig.disclaimer}</p>
          <nav aria-label="Informações legais" className="mt-5">
            <ul className="flex gap-1 text-sm">
              <li>
                <Link href="/privacy" className="inline-flex min-h-11 items-center rounded-md px-2 -ml-2 text-text-primary underline-offset-4 hover:underline">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="/terms" className="inline-flex min-h-11 items-center rounded-md px-2 text-text-primary underline-offset-4 hover:underline">
                  Termos
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-text-secondary">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-text-primary">
            Como funciona
          </h2>
          <p>{siteConfig.coverageNote}</p>
          <p>
            Exibimos apenas metadados públicos retornados pela API. Os vídeos são assistidos no YouTube. Uma live pode
            terminar depois da última atualização.
          </p>
          <p>
            Este site usa os YouTube API Services. Ao assistir aqui, valem os{" "}
            <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-accent-cyan underline underline-offset-2">
              Termos de Serviço do YouTube
            </a>{" "}
            e a{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-cyan underline underline-offset-2">
              Política de Privacidade do Google
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
