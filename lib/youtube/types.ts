/**
 * Tipos neutros movidos para lib/lives/types.ts (spec 021). Reexportados aqui durante a
 * transição, para que módulos ainda não migrados continuem compilando.
 */
export type {
  LangFilter,
  LiveItem,
  LiveLanguage,
  LivesErrorCode,
  LivesErrorPayload,
  LivesPayload,
  Platform,
  SortOption,
} from "@/lib/lives/types";

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
