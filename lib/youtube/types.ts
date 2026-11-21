export type LiveLanguage = "pt" | "en" | "es" | "unknown";
export type LangFilter = "all" | "pt" | "en" | "es";
export type SortOption = "relevance" | "viewers" | "recent";

/** Item normalizado exposto pela rota /api/lives (modelo do PRD §5). */
export interface LiveItem {
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

export type VideoLiveState = "live" | "ended" | "upcoming" | "unavailable";

/** Resposta de GET /api/lives/[videoId] (spec 002 RF2). */
export interface VideoStatusPayload {
  videoId: string;
  state: VideoLiveState;
  embedAllowed: boolean | "unknown";
  concurrentViewers: number | null;
  checkedAt: string;
  cached: boolean;
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

/* ---------- Formas parciais das respostas do YouTube (somente campos usados) ---------- */

export interface YtThumbnail {
  url?: string;
  width?: number;
  height?: number;
}

export type YtThumbnails = Partial<
  Record<"default" | "medium" | "high" | "standard" | "maxres", YtThumbnail>
>;

export interface YtSearchItem {
  id?: { kind?: string; videoId?: string };
  snippet?: {
    publishedAt?: string;
    channelId?: string;
    title?: string;
    description?: string;
    thumbnails?: YtThumbnails;
    channelTitle?: string;
    liveBroadcastContent?: string;
  };
}

export interface YtSearchResponse {
  nextPageToken?: string;
  items?: YtSearchItem[];
}

export interface YtVideoItem {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    channelId?: string;
    channelTitle?: string;
    publishedAt?: string;
    liveBroadcastContent?: string;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
    thumbnails?: YtThumbnails;
  };
  liveStreamingDetails?: {
    actualStartTime?: string;
    actualEndTime?: string;
    /** A API serializa unsigned long como string. */
    concurrentViewers?: string | number;
  };
  status?: { embeddable?: boolean };
}

export interface YtVideosResponse {
  items?: YtVideoItem[];
}
