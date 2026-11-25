/**
 * Teste de caracterização (spec 021, plano multiplataforma §5.2).
 *
 * Grava o comportamento atual do YouTube ANTES da Fase 1 (issues #33 a #38).
 * Durante a Fase 1, o snapshot só pode mudar para ACRESCENTAR campos; nenhum valor
 * dos campos da v1.0 pode mudar. Por isso o snapshot guarda só os campos da v1.0
 * (V1_KEYS), e os campos novos são verificados por testes próprios.
 */
import { describe, expect, it, vi } from "vitest";
import { MemoryCache } from "@/lib/cache/memory-cache";
import { getDemoLives } from "@/lib/fixtures/lives";
import { applyLiveFilters } from "@/lib/lives/filter";
import { MemoryCounter, MemoryLock } from "@/lib/store/memory";
import { createYoutubeClient } from "@/lib/youtube/client";
import { createLivesService, type PageData } from "@/lib/youtube/service";

/** Campos do LiveItem na v1.0 (PRD §5). */
const V1_KEYS = [
  "videoId",
  "title",
  "description",
  "channelId",
  "channelTitle",
  "thumbnailUrl",
  "publishedAt",
  "liveStartedAt",
  "concurrentViewers",
  "language",
  "watchUrl",
  "embedUrl",
  "isLive",
  "embedAllowed",
  "rank",
] as const;

function v1(items: readonly object[]) {
  return items.map((it) => {
    const rec = it as Record<string, unknown>;
    return Object.fromEntries(V1_KEYS.map((k) => [k, rec[k]]));
  });
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const thumb = (id: string) => ({ high: { url: `https://i.ytimg.com/vi/${id}/hqdefault_live.jpg` } });

/** Busca com casos variados: duplicata, entidades HTML, sem videoId, não-live. */
const searchBody = {
  nextPageToken: "NEXT_1",
  items: [
    { id: { videoId: "aaaaaaaaaaa" }, snippet: { title: "GTA 6 ao vivo &amp; missões", channelTitle: "Canal A", liveBroadcastContent: "live", thumbnails: thumb("aaaaaaaaaaa") } },
    { id: { videoId: "bbbbbbbbbbb" }, snippet: { title: "GTA VI live night drive", channelTitle: "Channel B", liveBroadcastContent: "live", thumbnails: thumb("bbbbbbbbbbb") } },
    { id: { videoId: "aaaaaaaaaaa" }, snippet: { title: "duplicado", channelTitle: "Canal A", liveBroadcastContent: "live" } },
    { id: { videoId: "ccccccccccc" }, snippet: { title: "GTA 6 en vivo", channelTitle: "Canal C", liveBroadcastContent: "live", thumbnails: thumb("ccccccccccc") } },
    { id: {}, snippet: { title: "sem id" } },
    { id: { videoId: "ddddddddddd" }, snippet: { title: "Encerrada", channelTitle: "Canal D", liveBroadcastContent: "live" } },
    { id: { videoId: "eeeeeeeeeee" }, snippet: { title: "Bate-papo GTA 6 &#39;teorias&#39;", channelTitle: "Canal E", liveBroadcastContent: "live", thumbnails: thumb("eeeeeeeeeee") } },
  ],
};

const videosBody = {
  items: [
    {
      id: "aaaaaaaaaaa",
      snippet: { title: "GTA 6 ao vivo &amp; missões", channelId: "UC_A", channelTitle: "Canal A", publishedAt: "2026-11-21T10:00:00Z", liveBroadcastContent: "live", defaultAudioLanguage: "pt-BR", thumbnails: thumb("aaaaaaaaaaa") },
      liveStreamingDetails: { actualStartTime: "2026-11-21T10:05:00Z", concurrentViewers: "1500" },
      status: { embeddable: true },
    },
    {
      id: "bbbbbbbbbbb",
      snippet: { title: "GTA VI live night drive", channelId: "UC_B", channelTitle: "Channel B", publishedAt: "2026-11-21T11:00:00Z", liveBroadcastContent: "live", defaultAudioLanguage: "en", thumbnails: thumb("bbbbbbbbbbb") },
      liveStreamingDetails: { actualStartTime: "2026-11-21T11:30:00Z", concurrentViewers: "9200" },
      status: { embeddable: false },
    },
    {
      id: "ccccccccccc",
      snippet: { title: "GTA 6 en vivo", channelId: "UC_C", channelTitle: "Canal C", publishedAt: "2026-11-21T09:00:00Z", liveBroadcastContent: "live", defaultLanguage: "es", thumbnails: thumb("ccccccccccc") },
      liveStreamingDetails: { actualStartTime: "2026-11-21T09:10:00Z" },
    },
    {
      id: "ddddddddddd",
      snippet: { title: "Encerrada", channelId: "UC_D", channelTitle: "Canal D", liveBroadcastContent: "none" },
      liveStreamingDetails: { actualStartTime: "2026-11-21T08:00:00Z", actualEndTime: "2026-11-21T09:00:00Z" },
    },
    {
      id: "eeeeeeeeeee",
      snippet: { title: "Bate-papo GTA 6 &#39;teorias&#39;", channelId: "UC_E", channelTitle: "Canal E", publishedAt: "2026-11-21T11:50:00Z", liveBroadcastContent: "live", thumbnails: thumb("eeeeeeeeeee") },
      liveStreamingDetails: { actualStartTime: "2026-11-21T11:55:00Z", concurrentViewers: "40" },
    },
  ],
};

function makeService() {
  const now = () => Date.parse("2026-11-21T12:00:00Z");
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) =>
    String(input).includes("/search?") ? json(200, searchBody) : json(200, videosBody),
  ) as unknown as typeof fetch;
  return createLivesService({
    client: createYoutubeClient({ apiKey: "K", regionCode: "BR", relevanceLanguage: "pt", fetchImpl, retryDelayMs: 0 }),
    cache: new MemoryCache<PageData>(50, now),
    counter: new MemoryCounter(now),
    lock: new MemoryLock(now),
    sleep: async () => {},
    config: { query: "q", ttlMs: 120_000, staleMs: 600_000, minUpstreamIntervalMs: 30_000, dailySearchBudget: 90 },
    now,
    log: () => {},
  });
}

describe("caracterização do YouTube (não pode mudar na Fase 1)", () => {
  it("itens normalizados pelo serviço", async () => {
    const page = await makeService().getLives();
    expect(page.nextPageToken).toBe("NEXT_1");
    expect(v1(page.items)).toMatchSnapshot();
  });

  const combos = [
    { lang: "all", sort: "relevance" },
    { lang: "all", sort: "viewers" },
    { lang: "all", sort: "recent" },
    { lang: "pt", sort: "relevance" },
    { lang: "en", sort: "viewers" },
    { lang: "es", sort: "recent" },
    { lang: "all", sort: "relevance", q: "gta 6" },
    { lang: "all", sort: "viewers", q: "MISSOES" },
  ] as const;

  for (const f of combos) {
    it(`filtros da rota: ${JSON.stringify(f)}`, async () => {
      const page = await makeService().getLives();
      expect(v1(applyLiveFilters(page.items, f)).map((i) => i.videoId)).toMatchSnapshot();
    });
  }

  it("dados de demonstração (sem datas, que dependem do relógio)", () => {
    const demo = v1(getDemoLives()).map(({ publishedAt, liveStartedAt, ...rest }) => ({
      ...rest,
      hasPublishedAt: typeof publishedAt === "string",
      hasLiveStartedAt: typeof liveStartedAt === "string",
    }));
    expect(demo).toMatchSnapshot();
  });
});
