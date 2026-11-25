import { liveId } from "@/lib/lives/identity";
import type { LiveItem, LiveLanguage } from "@/lib/lives/types";
import type { TwitchStream } from "./types";

/**
 * Rótulos de classificação que contam como "Conteúdo adulto" (spec 028 D1, premissa).
 * MatureGame fica de fora: a Twitch aplica automaticamente a todo jogo adulto, como GTA 6.
 * DebatedSocialIssuesAndPolitics fica de fora: é política, não conteúdo adulto.
 */
export const ADULT_LABELS: ReadonlySet<string> = new Set([
  "SexualThemes",
  "DrugsIntoxication",
  "ViolentGraphic",
  "ProfanityVulgarity",
  "Gambling",
]);

export function isAdult(labels: readonly string[]): boolean {
  return labels.some((l) => ADULT_LABELS.has(l));
}

const THUMB_PREFIX = "https://static-cdn.jtvnw.net/";

/** Template {width}x{height} → 640x360; só HTTPS no CDN da Twitch, senão null (CA5). */
export function twitchThumbnail(template: string | undefined): string | null {
  if (!template?.startsWith(THUMB_PREFIX)) return null;
  return template.replace("{width}", "640").replace("{height}", "360");
}

/** Idioma ISO 639-1 da Twitch → pt, en, es ou unknown (CA3). */
export function twitchLanguage(code: string | undefined): LiveLanguage {
  const base = code?.trim().toLowerCase().split(/[-_]/)[0];
  return base === "pt" || base === "en" || base === "es" ? base : "unknown";
}

/** Espectadores: número inteiro ≥ 0, ou null. Nunca 0 artificial (CA2). */
export function twitchViewers(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : null;
}

const isoOrNull = (v: string | undefined): string | null =>
  v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null;

/** Stream já validado → LiveItem (spec 019, mapeamento; spec 028 D7). */
export function normalizeStream(s: TwitchStream, rank: number, mature: boolean): LiveItem {
  const login = s.user_login.toLowerCase();
  const started = isoOrNull(s.started_at);
  return {
    id: liveId("twitch", login),
    platform: "twitch",
    sourceId: login,
    videoId: login,
    title: s.title.trim() || "Sem título",
    description: "",
    channelId: s.user_id,
    channelTitle: s.user_name.trim() || s.user_login,
    thumbnailUrl: twitchThumbnail(s.thumbnail_url),
    publishedAt: started,
    liveStartedAt: started,
    concurrentViewers: twitchViewers(s.viewer_count),
    language: twitchLanguage(s.language),
    watchUrl: `https://www.twitch.tv/${login}`,
    // O player da Twitch exige parent (hostname): a URL é montada no cliente (spec 025, #44).
    embedUrl: "",
    isLive: s.type === "live",
    embedAllowed: true,
    isMature: mature,
    rank,
  };
}
