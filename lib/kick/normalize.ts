import { liveId } from "@/lib/lives/identity";
import type { LiveItem, LiveLanguage } from "@/lib/lives/types";
import type { KickLivestream } from "./types";

/** CDNs de miniatura vistos no spike (spec 020, P2); a CSP da #52 libera só estes (D7). */
const THUMB_PREFIXES = ["https://images.kick.com/", "https://web.kick.com/"] as const;

/** Só HTTPS num CDN esperado da Kick; senão null (CA5). */
export function kickThumbnail(url: string | null | undefined): string | null {
  if (!url) return null;
  return THUMB_PREFIXES.some((p) => url.startsWith(p)) ? url : null;
}

/** BCP 47 da Kick (ex.: en-IN) → pt, en, es ou unknown pelo prefixo (D4). */
export function kickLanguage(code: string | undefined): LiveLanguage {
  const base = code?.trim().toLowerCase().split(/[-_]/)[0];
  return base === "pt" || base === "en" || base === "es" ? base : "unknown";
}

/** Espectadores: inteiro ≥ 0, ou null. Nunca 0 artificial (CA2). */
export function kickViewers(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : null;
}

const isoOrNull = (v: string | undefined): string | null =>
  v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null;

/** Live já validada → LiveItem (spec 047, mapeamento). */
export function normalizeLivestream(s: KickLivestream, rank: number): LiveItem {
  const slug = s.channel.slug.toLowerCase();
  const started = isoOrNull(s.started_at);
  return {
    id: liveId("kick", slug),
    platform: "kick",
    sourceId: slug,
    title: s.title.trim() || "Sem título",
    description: "",
    channelId: String(s.broadcaster_user.id),
    channelTitle: s.broadcaster_user.username.trim() || slug,
    thumbnailUrl: kickThumbnail(s.thumbnail),
    publishedAt: started,
    liveStartedAt: started,
    concurrentViewers: kickViewers(s.viewer_count),
    language: kickLanguage(s.language_code),
    watchUrl: `https://kick.com/${slug}`,
    // A Kick não exige parent; o player só entra em uso na #53 (D9).
    embedUrl: `https://player.kick.com/${slug}?autoplay=false&muted=true`,
    // O endpoint só devolve lives ativas.
    isLive: true,
    embedAllowed: true,
    // D-K1 (spec 020): has_mature_content vem em 98% da categoria; não gera selo (D6).
    isMature: false,
    rank,
  };
}
