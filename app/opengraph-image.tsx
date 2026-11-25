import { ImageResponse } from "next/og";
import { colors } from "@/lib/config/design-tokens";
import { getActivePlatforms } from "@/lib/lives/active-platforms";
import { formatPlatformList, heroLead } from "@/lib/lives/copy";

// Alinhada ao visual da home (spec 007): fundo neutro, tipografia sem caixa alta, uma cor de ação,
// o ponto vermelho "ao vivo" como assinatura e a marca do radar plana. Sem números: a imagem é
// gerada no build e dados ao vivo ficariam congelados.
/** Plataformas ativas no build (spec 034): a imagem é gerada no build, como o restante do texto. */
const platforms = getActivePlatforms();

export const alt = `Radar de Lives: lives de GTA 6 no ar agora, encontradas ${formatPlatformList(platforms)}. Marca de radar com ponto vermelho de ao vivo.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Mesma geometria de components/ui/radar-mark.tsx, ampliada. */
const radarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<circle cx="16" cy="16" r="14" fill="none" stroke="${colors.border}" stroke-width="1"/>
<circle cx="16" cy="16" r="9" fill="none" stroke="${colors.border}" stroke-width="1"/>
<circle cx="16" cy="16" r="4" fill="none" stroke="${colors.border}" stroke-width="1"/>
<path d="M16 16 L16 2 A14 14 0 0 1 29.3 11.7 Z" fill="${colors["accent-pink"]}"/>
<circle cx="16" cy="16" r="1.6" fill="${colors["accent-cyan"]}"/>
<circle cx="22.5" cy="8.5" r="1.3" fill="${colors["live-red"]}" stroke="${colors.background}" stroke-width="0.6"/>
</svg>`;
const radarSrc = `data:image/svg+xml;base64,${Buffer.from(radarSvg).toString("base64")}`;

// Versão pequena: traços mais grossos e ponto sem contorno (no tamanho pequeno o contorno parece um furo).
const smallMarkSvg = radarSvg
  .replaceAll('stroke-width="1"', 'stroke-width="2"')
  .replace(` stroke="${colors.background}" stroke-width="0.6"`, "");
const smallMarkSrc = `data:image/svg+xml;base64,${Buffer.from(smallMarkSvg).toString("base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: colors.background,
          color: colors["text-primary"],
          fontFamily: "sans-serif",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (Satori) só aceita <img> */}
            <img src={smallMarkSrc} width={48} height={48} alt="" />
            <div style={{ display: "flex", fontSize: 32, fontWeight: 600 }}>Radar de Lives</div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 72,
              fontSize: 84,
              fontWeight: 500,
              lineHeight: 1.04,
              letterSpacing: -2,
            }}
          >
            <span>Lives de GTA 6</span>
            <span>no ar agora</span>
          </div>

          <div style={{ display: "flex", marginTop: 28, fontSize: 30, lineHeight: 1.4, color: colors["text-secondary"] }}>
            {heroLead(platforms)}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 40, fontSize: 26 }}>
            <div style={{ display: "flex", width: 14, height: 14, borderRadius: 9999, background: colors["live-red"] }} />
            <span style={{ color: colors["text-primary"] }}>Ao vivo</span>
            <span style={{ color: colors["text-secondary"] }}>· radardelives.darioreis.dev</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 400,
            height: 400,
            borderRadius: 32,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (Satori) só aceita <img> */}
          <img src={radarSrc} width={320} height={320} alt="" />
        </div>
      </div>
    ),
    size,
  );
}
