import { liveId } from "@/lib/lives/identity";
import { inferLanguage } from "@/lib/utils/infer-language";
import type { LiveItem, YtSearchItem, YtThumbnails, YtVideoItem } from "./types";

export const VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/;
const ISO_DATE = (v: unknown): string | null =>
  typeof v === "string" && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null;

export function pickThumbnail(thumbs: YtThumbnails | undefined): string | null {
  if (!thumbs) return null;
  for (const key of ["high", "medium", "standard", "default"] as const) {
    const url = thumbs[key]?.url;
    if (typeof url === "string" && url.startsWith("https://i.ytimg.com/")) return url;
  }
  return null;
}

/** concurrentViewers chega como string (unsigned long). Ausente/ inválido => null, nunca 0 artificial. */
export function parseViewers(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

/** Remove duplicatas por videoId mantendo a primeira ocorrência (melhor posição). */
export function dedupeByVideoId<T extends { videoId: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.videoId)) continue;
    seen.add(item.videoId);
    out.push(item);
  }
  return out;
}

/** Extrai videoIds válidos e únicos da busca, preservando ordem. */
export function searchVideoIds(items: readonly YtSearchItem[] | undefined): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const it of items ?? []) {
    const id = it.id?.videoId;
    if (typeof id === "string" && VIDEO_ID.test(id) && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

/**
 * Normaliza a página: une search.list + videos.list (quando disponível).
 * - details === null: videos.list falhou; usa apenas a busca, sem inventar dados.
 * - details presente: descarta itens ausentes, não-live ou já encerrados (D10).
 */
export function normalizeLives(
  searchItems: readonly YtSearchItem[] | undefined,
  details: readonly YtVideoItem[] | null,
): LiveItem[] {
  const byId = new Map<string, YtVideoItem>();
  for (const d of details ?? []) if (d.id) byId.set(d.id, d);

  const bySearchId = new Map<string, YtSearchItem>();
  for (const s of searchItems ?? []) {
    const id = s.id?.videoId;
    if (id && !bySearchId.has(id)) bySearchId.set(id, s);
  }

  const out: LiveItem[] = [];
  searchVideoIds(searchItems).forEach((videoId, rank) => {
    const s = bySearchId.get(videoId)?.snippet ?? {};
    const d = byId.get(videoId);

    if (details !== null) {
      if (!d) return; // privado, removido ou indisponível
      if (d.snippet?.liveBroadcastContent && d.snippet.liveBroadcastContent !== "live") return;
      if (d.liveStreamingDetails?.actualEndTime) return;
    } else if (s.liveBroadcastContent && s.liveBroadcastContent !== "live") {
      return;
    }

    const title = d?.snippet?.title ?? s.title ?? "";
    const embeddable = d?.status?.embeddable;
    out.push({
      id: liveId("youtube", videoId),
      platform: "youtube",
      sourceId: videoId,
      videoId,
      title: decodeEntities(title) || "Sem título",
      description: decodeEntities(d?.snippet?.description ?? s.description ?? ""),
      channelId: d?.snippet?.channelId ?? s.channelId ?? "",
      channelTitle: decodeEntities(d?.snippet?.channelTitle ?? s.channelTitle ?? "") || "Canal não informado",
      thumbnailUrl: pickThumbnail(d?.snippet?.thumbnails) ?? pickThumbnail(s.thumbnails),
      publishedAt: ISO_DATE(d?.snippet?.publishedAt ?? s.publishedAt),
      liveStartedAt: ISO_DATE(d?.liveStreamingDetails?.actualStartTime),
      concurrentViewers: parseViewers(d?.liveStreamingDetails?.concurrentViewers),
      language: inferLanguage({
        defaultAudioLanguage: d?.snippet?.defaultAudioLanguage,
        defaultLanguage: d?.snippet?.defaultLanguage,
        title,
      }),
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      isLive: true,
      embedAllowed: typeof embeddable === "boolean" ? embeddable : "unknown",
      // A busca do YouTube não informa conteúdo adulto (spec 021 D4).
      isMature: false,
      rank,
    });
  });
  return out;
}

/** search.list devolve títulos com entidades HTML (&amp;, &#39;...). */
export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
