import { buttonBase, buttonStyles } from "@/components/ui/button";
import { siteConfig } from "@/lib/config/site";

/** Arte original: horizonte urbano noturno em SVG, sem assets de terceiros. */
function SkylineArt() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-[70%] w-full"
      viewBox="0 0 1440 420"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#09090D" stopOpacity="0" />
          <stop offset="0.55" stopColor="#3a1648" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FF3D81" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="hero-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF3D81" />
          <stop offset="1" stopColor="#A76BFF" />
        </linearGradient>
        <linearGradient id="hero-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.6" stopColor="#09090D" stopOpacity="0" />
          <stop offset="1" stopColor="#09090D" />
        </linearGradient>
        <pattern id="hero-windows" width="14" height="18" patternUnits="userSpaceOnUse">
          <rect x="4" y="5" width="3" height="5" fill="#32D8E8" opacity="0.35" />
        </pattern>
      </defs>
      <rect width="1440" height="420" fill="url(#hero-sky)" />
      <circle cx="1060" cy="300" r="150" fill="url(#hero-sun)" opacity="0.55" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x="890" y={262 + i * 22} width="340" height={4 + i * 1.5} fill="#09090D" opacity="0.8" />
      ))}
      {/* camada de fundo */}
      <path
        d="M0 330 L60 330 L60 280 L110 280 L110 300 L170 300 L170 240 L230 240 L230 310 L300 310 L300 260 L340 260 L340 200 L380 200 L380 300 L460 300 L460 250 L540 250 L540 320 L620 320 L620 270 L700 270 L700 230 L740 230 L740 310 L820 310 L820 290 L900 290 L900 250 L960 250 L960 320 L1040 320 L1040 280 L1120 280 L1120 230 L1180 230 L1180 300 L1260 300 L1260 260 L1340 260 L1340 310 L1440 310 L1440 420 L0 420 Z"
        fill="#1D1D27"
      />
      {/* camada frontal com janelas */}
      <path
        d="M0 360 L90 360 L90 300 L150 300 L150 350 L210 350 L210 180 L250 180 L250 160 L290 160 L290 350 L380 350 L380 290 L450 290 L450 370 L560 370 L560 220 L610 220 L610 370 L720 370 L720 320 L800 320 L800 250 L860 250 L860 370 L980 370 L980 330 L1060 330 L1060 200 L1120 200 L1120 360 L1220 360 L1220 300 L1300 300 L1300 350 L1440 350 L1440 420 L0 420 Z"
        fill="#101016"
      />
      <rect x="210" y="180" width="80" height="170" fill="url(#hero-windows)" />
      <rect x="560" y="220" width="50" height="150" fill="url(#hero-windows)" />
      <rect x="1060" y="200" width="60" height="160" fill="url(#hero-windows)" />
      <rect x="800" y="250" width="60" height="120" fill="url(#hero-windows)" />
      <line x1="0" y1="372" x2="1440" y2="372" stroke="#FF3D81" strokeOpacity="0.35" />
      <rect width="1440" height="420" fill="url(#hero-fade)" />
    </svg>
  );
}

export function HeroSection() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate overflow-hidden border-b border-border/60">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_0%,rgba(167,107,255,0.22),transparent_55%),radial-gradient(ellipse_at_90%_20%,rgba(50,216,232,0.12),transparent_50%)]"
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <SkylineArt />
        <div className="film-grain absolute inset-0" />
        {/* Véu para manter o texto legível sobre a arte */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,13,0.92)_0%,rgba(9,9,13,0.75)_40%,rgba(9,9,13,0.1)_75%)] max-md:bg-[linear-gradient(180deg,rgba(9,9,13,0.6)_0%,rgba(9,9,13,0.88)_60%,rgba(9,9,13,0.95)_100%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 sm:pb-32 sm:pt-24 lg:pb-40">
        <div className="max-w-3xl animate-rise">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent-cyan">
            Frequência aberta · YouTube ao vivo
          </p>
          <h1
            id="hero-title"
            className="mt-4 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-balance sm:text-6xl lg:text-7xl"
          >
            Lives de GTA 6 <span className="bg-gradient-to-r from-accent-pink to-accent-violet bg-clip-text text-transparent">no radar</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
            Transmissões públicas encontradas no YouTube, reunidas em um só lugar. Filtre, ordene e abra a live direto no
            YouTube.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#lives" className={`${buttonBase} ${buttonStyles.primary} px-6`}>
              Ver lives encontradas
            </a>
            <p className="max-w-xs text-xs leading-relaxed text-text-secondary">{siteConfig.coverageNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
