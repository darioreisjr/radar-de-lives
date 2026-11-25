import type { Platform } from "@/lib/lives/types";

/** Texto e link de privacidade mostrados antes de carregar o player de terceiros. */
export interface PlayerConsent {
  /** Começo da frase: "O player é carregado <from>, que pode coletar dados de uso conforme <artigo> <privacyName>". */
  from: string;
  /** Artigo de `privacyName` ("a Política…", "o Aviso…"): português tem gênero (D1). */
  privacyArticle: "a" | "o";
  privacyName: string;
  privacyUrl: string;
}

/**
 * Dados de cada plataforma para a interface (spec 025).
 * Português tem gênero ("no YouTube" × "na Twitch"), então as formas vêm prontas (D1).
 */
export interface PlatformMeta {
  /** Nome curto: "YouTube". */
  label: string;
  /** "no YouTube" / "na Twitch". */
  inLabel: string;
  /** "do YouTube" / "da Twitch". */
  ofLabel: string;
  /** Sujeito no começo da frase: "O YouTube" / "A Twitch". */
  subjectLabel: string;
  /** Aceita player embutido neste site. */
  embed: boolean;
  /** URL do iframe oficial. `hostname` é exigido pela Twitch (parâmetro parent). */
  embedSrc?: (sourceId: string, opts: { hostname: string }) => string;
  /** Presente sempre que `embed` for true (D2). */
  consent?: PlayerConsent;
  /** Tamanho mínimo exigido pelo player da plataforma, em px (spec 032 D3). */
  minPlayer?: { width: number; height: number };
}

export const PLATFORMS: Record<Platform, PlatformMeta> = {
  youtube: {
    label: "YouTube",
    inLabel: "no YouTube",
    ofLabel: "do YouTube",
    subjectLabel: "O YouTube",
    embed: true,
    // URL oficial (player_parameters), sem autoplay (spec 002 D1/D2).
    embedSrc: (id) => `https://www.youtube.com/embed/${encodeURIComponent(id)}?playsinline=1&rel=0`,
    consent: {
      from: "do YouTube, um serviço do Google",
      privacyArticle: "a",
      privacyName: "Política de Privacidade do Google",
      privacyUrl: "https://policies.google.com/privacy",
    },
  },
  twitch: {
    label: "Twitch",
    inLabel: "na Twitch",
    ofLabel: "da Twitch",
    subjectLabel: "A Twitch",
    embed: true,
    // Player oficial (spec 032): parent obrigatório; sem autoplay e sem som até a pessoa agir (D1, D2).
    embedSrc: (login, { hostname }) =>
      `https://player.twitch.tv/?channel=${encodeURIComponent(login)}&parent=${encodeURIComponent(hostname)}&autoplay=false&muted=true`,
    consent: {
      from: "da Twitch",
      privacyArticle: "o",
      privacyName: "Aviso de Privacidade da Twitch",
      // Citado no Developer Agreement da Twitch; URL final conferida em 2026-11-25.
      privacyUrl: "https://legal.twitch.com/legal/privacy-notice/",
    },
    // A Twitch exige no mínimo 400×300 px (spec 019, doc oficial de embed).
    minPlayer: { width: 400, height: 300 },
  },
  // Player embutido da Kick entra na #53; até lá, só link.
  kick: { label: "Kick", inLabel: "na Kick", ofLabel: "da Kick", subjectLabel: "A Kick", embed: false },
};

export const platformMeta = (p: Platform): PlatformMeta => PLATFORMS[p];
