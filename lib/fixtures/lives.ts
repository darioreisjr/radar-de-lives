import { liveId } from "@/lib/lives/identity";
import type { LiveItem } from "@/lib/lives/types";

/**
 * DADOS SIMULADOS — apenas para desenvolvimento visual (D15).
 * Não representam vídeos, canais ou audiências reais. A UI marca cada item como SIMULADO
 * e não gera links para o YouTube a partir destes itens.
 */
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const base = [
  { title: "[EXEMPLO] Explorando a cidade à noite — gameplay ao vivo", channel: "Canal de exemplo A", viewers: 12840, lang: "pt", started: 42 },
  { title: "[EXAMPLE] Night drive and side missions live", channel: "Example Channel B", viewers: 5310, lang: "en", started: 95 },
  { title: "[EJEMPLO] Primeras horas en directo", channel: "Canal de ejemplo C", viewers: null, lang: "es", started: 18 },
  { title: "[EXEMPLO] Teorias e notícias do lançamento — bate-papo", channel: "Canal de exemplo D", viewers: 880, lang: "pt", started: 130 },
  { title: "[EXAMPLE] Photo mode tour of the coastline", channel: "Example Channel E", viewers: null, lang: "unknown", started: 7 },
  { title: "[EXEMPLO] Speedrun de missões com a comunidade", channel: "Canal de exemplo F", viewers: 2405, lang: "pt", started: 61 },
  { title: "[EJEMPLO] Persecuciones y retos de la comunidad", channel: "Canal de ejemplo G", viewers: 1490, lang: "es", started: 220 },
  { title: "[EXAMPLE] Long title to test wrapping in cards: chill exploration, collectibles and viewer requests all night", channel: "Example Channel H with a long name", viewers: 64, lang: "en", started: 300 },
] as const;

export function getDemoLives(): LiveItem[] {
  return base.map((b, i) => {
    const videoId = `demo-${String(i + 1).padStart(3, "0")}`;
    return {
      id: liveId("youtube", videoId),
      platform: "youtube",
      sourceId: videoId,
      videoId,
      title: b.title,
      description: "Item simulado para desenvolvimento visual.",
      channelId: `demo-channel-${i + 1}`,
      channelTitle: b.channel,
      thumbnailUrl: null,
      publishedAt: minutesAgo(b.started + 5),
      liveStartedAt: minutesAgo(b.started),
      concurrentViewers: b.viewers,
      language: b.lang,
      watchUrl: "",
      embedUrl: "",
      isLive: true,
      embedAllowed: "unknown",
      isMature: false,
      rank: i,
    };
  });
}
