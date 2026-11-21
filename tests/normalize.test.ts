import { describe, expect, it } from "vitest";
import { applyLiveFilters } from "@/lib/lives/filter";
import { inferLanguage } from "@/lib/utils/infer-language";
import { dedupeByVideoId, normalizeLives, parseViewers } from "@/lib/youtube/normalize";
import { buildCombinedQuery } from "@/lib/youtube/searches";
import type { YtSearchItem, YtVideoItem } from "@/lib/youtube/types";

const s = (videoId: string, title = `Live ${videoId}`): YtSearchItem => ({
  id: { kind: "youtube#video", videoId },
  snippet: {
    title,
    channelId: "UC1",
    channelTitle: "Canal",
    publishedAt: "2026-11-21T10:00:00Z",
    liveBroadcastContent: "live",
    thumbnails: { high: { url: `https://i.ytimg.com/vi/${videoId}/hqdefault_live.jpg` } },
  },
});
const d = (id: string, extra: Partial<YtVideoItem> = {}): YtVideoItem => ({
  id,
  snippet: { liveBroadcastContent: "live" },
  liveStreamingDetails: { actualStartTime: "2026-11-21T09:00:00Z" },
  status: { embeddable: true },
  ...extra,
});

describe("dedupe", () => {
  it("remove videoIds repetidos mantendo a primeira ocorrência (CA5)", () => {
    const items = normalizeLives([s("aaaaaaaaaaa"), s("bbbbbbbbbbb"), s("aaaaaaaaaaa", "dup")], [d("aaaaaaaaaaa"), d("bbbbbbbbbbb")]);
    expect(items.map((i) => i.videoId)).toEqual(["aaaaaaaaaaa", "bbbbbbbbbbb"]);
    expect(dedupeByVideoId([{ videoId: "x" }, { videoId: "x" }, { videoId: "y" }])).toHaveLength(2);
  });

  it("ignora resultados sem videoId válido", () => {
    expect(normalizeLives([{ id: { kind: "youtube#channel" } }, s("bad id!")], [])).toEqual([]);
  });
});

describe("concurrentViewers (CA6)", () => {
  it("ausente vira null, nunca 0", () => {
    const [item] = normalizeLives([s("aaaaaaaaaaa")], [d("aaaaaaaaaaa")]);
    expect(item.concurrentViewers).toBeNull();
  });
  it("string numérica vira número; zero real é preservado", () => {
    expect(parseViewers("1534")).toBe(1534);
    expect(parseViewers("0")).toBe(0);
    expect(parseViewers(undefined)).toBeNull();
    expect(parseViewers("abc")).toBeNull();
  });
  it("sem videos.list (falha), não inventa dados", () => {
    const [item] = normalizeLives([s("aaaaaaaaaaa")], null);
    expect(item.concurrentViewers).toBeNull();
    expect(item.liveStartedAt).toBeNull();
    expect(item.embedAllowed).toBe("unknown");
  });
});

describe("revalidação de lives (D10)", () => {
  it("descarta encerradas, não-live e ausentes em videos.list", () => {
    const items = normalizeLives(
      [s("aaaaaaaaaaa"), s("bbbbbbbbbbb"), s("ccccccccccc"), s("ddddddddddd")],
      [
        d("aaaaaaaaaaa"),
        d("bbbbbbbbbbb", { liveStreamingDetails: { actualEndTime: "2026-11-21T11:00:00Z" } }),
        d("ccccccccccc", { snippet: { liveBroadcastContent: "none" } }),
      ],
    );
    expect(items.map((i) => i.videoId)).toEqual(["aaaaaaaaaaa"]);
  });
  it("decodifica entidades HTML e monta URLs oficiais", () => {
    const [item] = normalizeLives([s("aaaaaaaaaaa", "GTA 6 &amp; amigos &#39;ao vivo&#39;")], null);
    expect(item.title).toBe("GTA 6 & amigos 'ao vivo'");
    expect(item.watchUrl).toBe("https://www.youtube.com/watch?v=aaaaaaaaaaa");
    expect(item.thumbnailUrl).toMatch(/^https:\/\/i\.ytimg\.com\//);
  });
});

describe("idioma estimado (D11)", () => {
  it("usa metadados antes do título", () => {
    expect(inferLanguage({ defaultAudioLanguage: "pt-BR", title: "en vivo" })).toBe("pt");
    expect(inferLanguage({ defaultLanguage: "es-419" })).toBe("es");
    expect(inferLanguage({ title: "GTA 6 AO VIVO agora" })).toBe("pt");
    expect(inferLanguage({ title: "GTA 6 en vivo" })).toBe("es");
    expect(inferLanguage({ title: "GTA 6 live stream" })).toBe("unknown");
    expect(inferLanguage({ defaultAudioLanguage: "fr" })).toBe("unknown");
  });
});

// Títulos sintéticos que imitam padrões vistos com dados reais (spec 004 D6).
describe("idioma estimado — calibração com dados reais (spec 004)", () => {
  const en = { defaultAudioLanguage: "en" };
  it("metadado en + pista forte de pt vira pt (CA1)", () => {
    expect(inferLanguage({ ...en, title: "🔴 GTA 6 AO VIVO 🔥 | EXPLORANDO" })).toBe("pt");
    expect(inferLanguage({ ...en, title: "GTA 6 - zerando a história" })).toBe("pt");
    expect(inferLanguage({ ...en, title: "Jogando GTA VI pela primeira vez" })).toBe("pt");
  });
  it("metadado en + pista forte de es vira es (CA2)", () => {
    expect(inferLanguage({ ...en, title: "🔴 GTA 6 EN VIVO" })).toBe("es");
    expect(inferLanguage({ ...en, title: "Modo historia (EN DIRECTO)" })).toBe("es");
  });
  it("idioma explícito ou escrita não latina vira Outro (CA3)", () => {
    expect(inferLanguage({ ...en, title: "GTA 6 LIVE | HINDI" })).toBe("unknown");
    expect(inferLanguage({ ...en, title: "GTA VI Live Stream Telugu 24 hrs" })).toBe("unknown");
    expect(inferLanguage({ ...en, title: "GTA 6 LIVE وأخيراً" })).toBe("unknown");
    expect(inferLanguage({ ...en, title: "GTA 6 ライブ" })).toBe("unknown");
  });
  it("metadado não suportado vira Outro; pt/es confiáveis (CA4)", () => {
    expect(inferLanguage({ defaultAudioLanguage: "hi", title: "GTA 6 LIVE" })).toBe("unknown");
    expect(inferLanguage({ defaultAudioLanguage: "pt-BR", title: "GTA 6 LIVE GAMEPLAY" })).toBe("pt");
  });
  it("'India' sozinho não muda; inglês sem pistas continua en (CA5)", () => {
    expect(inferLanguage({ ...en, title: "🔴 GTA 6 LIVE 🔥 PS5 Gameplay | India" })).toBe("en");
    expect(inferLanguage({ ...en, title: "GTA 6 LIVE GAMEPLAY 60 FPS" })).toBe("en");
  });
  it("palavras ambíguas (pt/es) não decidem", () => {
    expect(inferLanguage({ title: "GTA 6 explorando la historia" })).toBe("unknown");
  });
});

describe("filtros e ordenação", () => {
  const base = normalizeLives(
    [s("aaaaaaaaaaa", "GTA 6 ao vivo"), s("bbbbbbbbbbb", "GTA 6 en vivo"), s("ccccccccccc", "Heist night")],
    [
      d("aaaaaaaaaaa", { liveStreamingDetails: { concurrentViewers: "10", actualStartTime: "2026-11-21T08:00:00Z" } }),
      d("bbbbbbbbbbb", { liveStreamingDetails: { actualStartTime: "2026-11-21T10:00:00Z" } }),
      d("ccccccccccc", { liveStreamingDetails: { concurrentViewers: "500", actualStartTime: "2026-11-21T09:00:00Z" } }),
    ],
  );
  it("viewers: maior primeiro e sem contagem no fim", () => {
    expect(applyLiveFilters(base, { lang: "all", sort: "viewers" }).map((i) => i.videoId)).toEqual([
      "ccccccccccc",
      "aaaaaaaaaaa",
      "bbbbbbbbbbb",
    ]);
  });
  it("recent: início mais recente primeiro", () => {
    expect(applyLiveFilters(base, { lang: "all", sort: "recent" })[0].videoId).toBe("bbbbbbbbbbb");
  });
  it("texto ignora acentos/caixa; idioma filtra estimado", () => {
    expect(applyLiveFilters(base, { q: "HEÍST", lang: "all", sort: "relevance" })).toHaveLength(1);
    expect(applyLiveFilters(base, { lang: "es", sort: "relevance" }).map((i) => i.videoId)).toEqual(["bbbbbbbbbbb"]);
  });
});

describe("consulta combinada (D1)", () => {
  it("une termos com OR", () => {
    expect(buildCombinedQuery(["GTA 6 live", "GTA6"])).toBe('"GTA 6 live"|GTA6');
  });
});
