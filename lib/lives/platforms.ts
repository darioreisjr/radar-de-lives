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
 * Aviso de que a plataforma pode exigir login no player embutido (spec 044).
 * Na Twitch, GTA 6 tem o rótulo MatureGame, e o player pede conta logada.
 */
export interface LoginNotice {
  /** No consentimento, antes de "Carregar player". */
  beforeLoad: string;
  /** No rodapé, com o player carregado. */
  withPlayer: string;
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
  /** Nome da API com a preposição: "da YouTube Data API" / "da API da Twitch" (spec 034). */
  apiLabel: string;
  /** Aceita player embutido neste site. */
  embed: boolean;
  /** URL do iframe oficial. `hostname` é exigido pela Twitch (parâmetro parent). */
  embedSrc?: (sourceId: string, opts: { hostname: string }) => string;
  /** Presente sempre que `embed` for true (D2). */
  consent?: PlayerConsent;
  /** Tamanho mínimo exigido pelo player da plataforma, em px (spec 032 D3). */
  minPlayer?: { width: number; height: number };
  /** Aviso de login exigido pelo player (spec 044). Ausente = não há aviso. */
  loginNotice?: LoginNotice;
}

export const PLATFORMS: Record<Platform, PlatformMeta> = {
  youtube: {
    label: "YouTube",
    inLabel: "no YouTube",
    ofLabel: "do YouTube",
    subjectLabel: "O YouTube",
    apiLabel: "da YouTube Data API",
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
    apiLabel: "da API da Twitch",
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
    // GTA 6 é MatureGame na Twitch: o player embutido pede login (QA da spec 042, falha B2).
    loginNotice: {
      beforeLoad:
        "A Twitch classifica GTA 6 como jogo para adultos e pode pedir que você entre na sua conta para assistir. Se pedir, use “Abrir na Twitch”.",
      withPlayer: "Se a Twitch pedir login ou o player não carregar, abra na Twitch.",
    },
  },
  kick: {
    label: "Kick",
    inLabel: "na Kick",
    ofLabel: "da Kick",
    subjectLabel: "A Kick",
    apiLabel: "da API da Kick",
    embed: true,
    // Player oficial (spec 051 D1): sem parent; sem autoplay e sem som até a pessoa agir.
    // No spike (spec 020, P3) tocou sem pedir login: sem loginNotice; sem tamanho mínimo documentado.
    embedSrc: (slug) => `https://player.kick.com/${encodeURIComponent(slug)}?autoplay=false&muted=true`,
    consent: {
      from: "da Kick",
      privacyArticle: "a",
      privacyName: "Política de Privacidade da Kick",
      // Conferida em 2026-11-27 (200).
      privacyUrl: "https://kick.com/privacy-policy",
    },
  },
};

export const platformMeta = (p: Platform): PlatformMeta => PLATFORMS[p];
