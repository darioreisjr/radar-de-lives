import { RadarPanel } from "@/components/hero/radar-panel";
import { buttonBase, buttonStyles } from "@/components/ui/button";

/**
 * Hero em divisão assimétrica (spec 007): texto à esquerda, painel do radar com dados reais à direita.
 * Sem arte decorativa, gradientes ou texturas: a cor fica nas miniaturas e no painel.
 */
export function HeroSection() {
  return (
    <section id="top" aria-labelledby="hero-title" className="border-b border-border">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
        <div className="max-w-2xl animate-rise">
          <h1
            id="hero-title"
            className="font-display text-5xl font-medium leading-[1.04] tracking-[-0.02em] text-balance sm:text-6xl lg:text-7xl"
          >
            Lives de GTA&nbsp;6 no ar agora
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary">
            Transmissões públicas encontradas no YouTube, reunidas em um só lugar. Filtre por idioma, ordene por público e
            assista aqui ou no YouTube.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#lives" className={`${buttonBase} ${buttonStyles.primary} h-12 px-6`}>
              Ver lives encontradas
            </a>
            <a
              href="#sobre"
              className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-text-secondary transition-colors duration-[140ms] hover:text-text-primary"
            >
              Como funciona
            </a>
          </div>
        </div>
        <RadarPanel />
      </div>
    </section>
  );
}
