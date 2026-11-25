/**
 * Modelo de live independente de plataforma (spec 021, PRD §12.4).
 * Os tipos crus de cada plataforma ficam no módulo dela (ex.: lib/youtube/types.ts).
 */

export type Platform = "youtube" | "twitch" | "kick";

export type LiveLanguage = "pt" | "en" | "es" | "unknown";
export type LangFilter = "all" | "pt" | "en" | "es";
export type SortOption = "relevance" | "viewers" | "recent";

/** Item normalizado exposto pela rota /api/lives (PRD §5 e §12.4). */
export interface LiveItem {
  /** Chave única entre plataformas: `${platform}:${sourceId}`. */
  id: string;
  platform: Platform;
  /** Id na plataforma de origem (videoId no YouTube, login do canal na Twitch, slug na Kick). */
  sourceId: string;
  /**
   * @deprecated Igual a `sourceId`. Mantido para não mudar o payload na Fase 1 (spec 021 D1);
   * a remoção fica para a consolidação (#57). Código novo deve usar `id` ou `sourceId`.
   */
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  liveStartedAt: string | null;
  /** Ausente na API => null. Nunca converter para 0. */
  concurrentViewers: number | null;
  /** Estimado a partir de metadados/título. */
  language: LiveLanguage;
  watchUrl: string;
  embedUrl: string;
  isLive: boolean;
  embedAllowed: boolean | "unknown";
  /** Marcada como conteúdo adulto pela plataforma (PRD D6). Sempre false no YouTube. */
  isMature: boolean;
  /** Posição original na busca (ordenação por relevância). */
  rank: number;
}

export interface LivesPayload {
  items: LiveItem[];
  updatedAt: string;
  cached: boolean;
  stale: boolean;
  nextPageToken: string | null;
  source: "youtube" | "fixture";
}

export type LivesErrorCode =
  | "missing_api_key"
  | "quota_exceeded"
  | "rate_limited"
  | "upstream_unavailable"
  | "upstream_config"
  | "invalid_params";

export interface LivesErrorPayload {
  error: { code: LivesErrorCode; message: string };
  retryAfterSeconds?: number;
}
