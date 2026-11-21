import { ImageResponse } from "next/og";
import { colors } from "@/lib/config/design-tokens";

// Arte original (spec 003 D3): anéis de radar, horizonte e gradiente da identidade. Sem assets de terceiros.
export const alt =
  "Radar de Lives: lives de GTA 6 encontradas no YouTube. Arte com anéis de radar sobre horizonte urbano noturno.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BUILDINGS = [
  [0, 120], [70, 180], [130, 150], [200, 260], [260, 190], [330, 230], [400, 160], [460, 300],
  [520, 210], [590, 170], [650, 250], [720, 200], [790, 280], [850, 180], [920, 240], [990, 160],
  [1050, 220], [1120, 190],
] as const;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: `linear-gradient(180deg, ${colors.background} 0%, #1b0d26 55%, #3a1648 100%)`,
          color: colors["text-primary"],
          fontFamily: "sans-serif",
        }}
      >
        {/* sol / brilho */}
        <div
          style={{
            position: "absolute",
            right: 90,
            bottom: 150,
            width: 360,
            height: 360,
            borderRadius: 9999,
            background: `linear-gradient(180deg, ${colors["accent-pink"]} 0%, ${colors["accent-violet"]} 100%)`,
            opacity: 0.55,
            display: "flex",
          }}
        />
        {/* horizonte */}
        {BUILDINGS.map(([x, h]) => (
          <div
            key={x}
            style={{
              position: "absolute",
              left: x,
              bottom: 0,
              width: 64,
              height: Math.round(h * 0.7),
              background: "#101016",
              borderTop: `3px solid ${colors["surface-raised"]}`,
              display: "flex",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 4,
            background: colors["accent-pink"],
            opacity: 0.7,
            display: "flex",
          }}
        />

        {/* véu de legibilidade à esquerda, como no hero */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(9,9,13,0.94) 0%, rgba(9,9,13,0.78) 45%, rgba(9,9,13,0) 75%)",
            display: "flex",
          }}
        />

        {/* conteúdo */}
        <div style={{ display: "flex", flexDirection: "column", padding: "72px 80px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 9999,
                border: `5px solid ${colors.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9999,
                  border: `5px solid ${colors.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: 9999, background: colors["accent-cyan"], display: "flex" }} />
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  right: 8,
                  width: 12,
                  height: 12,
                  borderRadius: 9999,
                  background: colors["live-red"],
                  display: "flex",
                }}
              />
            </div>
            <div style={{ display: "flex", fontSize: 34, letterSpacing: 6, fontWeight: 700 }}>
              RADAR&nbsp;<span style={{ color: colors["accent-pink"] }}>DE</span>&nbsp;LIVES
            </div>
          </div>

          <div style={{ display: "flex", marginTop: 70, fontSize: 92, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>
            LIVES DE GTA 6
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: colors["accent-pink"],
            }}
          >
            NO RADAR
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: colors["text-secondary"], maxWidth: 640 }}>
            Transmissões públicas encontradas no YouTube.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
