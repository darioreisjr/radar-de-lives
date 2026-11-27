import { describe, expect, it, vi } from "vitest";
import { MemoryCache } from "@/lib/cache/memory-cache";
import { createLivesAggregator, interleave } from "@/lib/lives/aggregator";
import { liveId } from "@/lib/lives/identity";
import type { LivesProvider, ProviderResult } from "@/lib/lives/providers/types";
import { createYoutubeProvider } from "@/lib/lives/providers/youtube";
import type { LiveItem, Platform } from "@/lib/lives/types";
import { MemoryCounter, MemoryLock } from "@/lib/store/memory";
import type { TelemetryEvent, TelemetryFields } from "@/lib/telemetry";
import { createYoutubeClient } from "@/lib/youtube/client";
import { LivesError } from "@/lib/youtube/errors";
import { createLivesService, type PageData } from "@/lib/youtube/service";

const T0 = Date.parse("2026-11-21T12:00:00Z");

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const searchBody = {
  nextPageToken: "NEXT_1",
  items: ["aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc"].map((id) => ({
    id: { videoId: id },
    snippet: { title: `Live ${id}`, channelTitle: "C", liveBroadcastContent: "live" },
  })),
};
const videosBody = {
  items: ["aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc"].map((id, i) => ({
    id,
    snippet: { title: `Live ${id}`, channelId: "UC", channelTitle: "C", liveBroadcastContent: "live" },
    liveStreamingDetails: { concurrentViewers: String(100 * (i + 1)) },
  })),
};

/** Serviço real do YouTube sobre fetch falso; devolve também o espião do fetch e o cache. */
function youtube(opts: { fetchImpl?: typeof fetch; cache?: MemoryCache<PageData> } = {}) {
  const now = () => T0;
  const fetchImpl =
    opts.fetchImpl ??
    (vi.fn(async (input: RequestInfo | URL) =>
      String(input).includes("/search?") ? json(200, searchBody) : json(200, videosBody),
    ) as unknown as typeof fetch);
  const cache = opts.cache ?? new MemoryCache<PageData>(50, now);
  const service = createLivesService({
    client: createYoutubeClient({ apiKey: "K_SECRETA", regionCode: "BR", relevanceLanguage: "pt", fetchImpl, retryDelayMs: 0 }),
    cache,
    counter: new MemoryCounter(now),
    lock: new MemoryLock(now),
    sleep: async () => {},
    config: { query: "q", ttlMs: 120_000, staleMs: 600_000, minUpstreamIntervalMs: 30_000, dailySearchBudget: 90 },
    now,
    log: () => {},
  });
  return { service, fetchImpl: fetchImpl as unknown as ReturnType<typeof vi.fn>, cache };
}

const item = (platform: Platform, sourceId: string, rank: number): LiveItem => ({
  id: liveId(platform, sourceId), platform, sourceId,
  title: sourceId, description: "", channelId: "c", channelTitle: "c", thumbnailUrl: null,
  publishedAt: null, liveStartedAt: null, concurrentViewers: null, language: "unknown",
  watchUrl: "", embedUrl: "", isLive: true, embedAllowed: true, isMature: false, rank,
});

function fake(platform: Platform, behavior: Partial<ProviderResult> | Error | "hang", timeoutMs?: number): LivesProvider {
  return {
    platform,
    timeoutMs,
    isConfigured: () => true,
    getLives: vi.fn(async () => {
      if (behavior === "hang") return new Promise<ProviderResult>(() => {});
      if (behavior instanceof Error) throw behavior;
      return { items: [], updatedAt: "2026-11-21T12:00:00.000Z", cached: false, stale: false, nextPageToken: null, ...behavior };
    }),
  };
}

describe("agregador de provedores (spec 022)", () => {
  it("CA1: só YouTube → mesmos itens, ordem e valores do serviço", async () => {
    const direct = await youtube().service.getLives();
    const { service } = youtube();
    const agg = await createLivesAggregator({ providers: [createYoutubeProvider(service, true)], log: () => {} }).getLives();
    expect(agg.items).toEqual(direct.items);
    expect(agg).toMatchObject({ updatedAt: direct.updatedAt, cached: direct.cached, stale: direct.stale, nextPageToken: "NEXT_1" });
    expect(agg.sources).toEqual([{ platform: "youtube", ok: true, cached: false, stale: false, updatedAt: direct.updatedAt }]);
  });

  it("CA2: um provedor falha → itens do outro e sources marca a falha", async () => {
    const log = vi.fn();
    const agg = await createLivesAggregator({
      providers: [fake("youtube", { items: [item("youtube", "a", 0)] }), fake("twitch", new LivesError("rate_limited"))],
      log,
    }).getLives();
    expect(agg.items.map((i) => i.id)).toEqual(["youtube:a"]);
    expect(agg.sources).toEqual([
      expect.objectContaining({ platform: "youtube", ok: true }),
      { platform: "twitch", ok: false, cached: false, stale: false, updatedAt: null, errorCode: "rate_limited" },
    ]);
    expect(log).toHaveBeenCalledWith("provider_failed", { platform: "twitch", code: "rate_limited" });
  });

  it("CA3: todos falham → relança o erro do YouTube (mesmo code de hoje)", async () => {
    const agg = createLivesAggregator({
      providers: [fake("twitch", new LivesError("upstream_unavailable")), fake("youtube", new LivesError("quota_exceeded"))],
      log: () => {},
    });
    await expect(agg.getLives()).rejects.toMatchObject({ code: "quota_exceeded" });
  });

  it("CA3: só YouTube sem chave → missing_api_key, como hoje", async () => {
    const svc = createLivesService({
      client: null,
      cache: new MemoryCache<PageData>(50, () => T0),
      counter: new MemoryCounter(() => T0),
      lock: new MemoryLock(() => T0),
      config: { query: "q", ttlMs: 1, staleMs: 1, minUpstreamIntervalMs: 1, dailySearchBudget: 1 },
      log: () => {},
    });
    const agg = createLivesAggregator({ providers: [createYoutubeProvider(svc, false)], log: () => {} });
    await expect(agg.getLives()).rejects.toMatchObject({ code: "missing_api_key" });
  });

  it("CA4: provedor lento com timeoutMs vira falha sem segurar a resposta", async () => {
    vi.useFakeTimers();
    try {
      const pending = createLivesAggregator({
        providers: [fake("youtube", { items: [item("youtube", "a", 0)] }), fake("twitch", "hang", 5_000)],
        log: () => {},
      }).getLives();
      await vi.advanceTimersByTimeAsync(5_001);
      const agg = await pending;
      expect(agg.items).toHaveLength(1);
      expect(agg.sources[1]).toMatchObject({ platform: "twitch", ok: false, errorCode: "upstream_unavailable" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("CA5: chamadas ao YouTube iguais às do serviço direto (cache vazio e cache válido)", async () => {
    const direct = youtube();
    await direct.service.getLives();
    const viaAgg = youtube();
    const agg = createLivesAggregator({ providers: [createYoutubeProvider(viaAgg.service, true)], log: () => {} });
    await agg.getLives();
    expect(viaAgg.fetchImpl.mock.calls.length).toBe(direct.fetchImpl.mock.calls.length);
    expect(viaAgg.fetchImpl.mock.calls.length).toBe(2); // search.list + videos.list
    await agg.getLives(); // cache válido
    expect(viaAgg.fetchImpl.mock.calls.length).toBe(2);
  });

  it("CA6: provider_failed nunca registra mensagem, URL ou segredo", async () => {
    const calls: [TelemetryEvent, TelemetryFields | undefined][] = [];
    await createLivesAggregator({
      providers: [fake("youtube", { items: [] }), fake("kick", new Error("falhou https://x?key=K_SECRETA"))],
      log: (e, f) => calls.push([e, f]),
    }).getLives();
    expect(calls).toEqual([["provider_failed", { platform: "kick", code: "upstream_unavailable" }]]);
    expect(JSON.stringify(calls)).not.toContain("K_SECRETA");
  });

  it("CA7: cache com itens anteriores à 021 sai completo e sem colapsar", async () => {
    const cache = new MemoryCache<PageData>(50, () => T0);
    const legacy = ["aaaaaaaaaaa", "bbbbbbbbbbb"].map((videoId, rank) => ({
      videoId, title: videoId, description: "", channelId: "c", channelTitle: "c", thumbnailUrl: null,
      publishedAt: null, liveStartedAt: null, concurrentViewers: null, language: "unknown",
      watchUrl: "", embedUrl: "", isLive: true, embedAllowed: true, rank,
    })) as unknown as LiveItem[];
    await cache.set("page:first", { value: { items: legacy, nextPageToken: null }, storedAt: T0 }, 600_000);
    const { service, fetchImpl } = youtube({ cache });
    const agg = await createLivesAggregator({ providers: [createYoutubeProvider(service, true)], log: () => {} }).getLives();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(agg.items.map((i) => [i.id, i.platform, i.sourceId, i.isMature])).toEqual([
      ["youtube:aaaaaaaaaaa", "youtube", "aaaaaaaaaaa", false],
      ["youtube:bbbbbbbbbbb", "youtube", "bbbbbbbbbbb", false],
    ]);
  });

  it("CA8: intercala por posição e renumera o rank só com mais de um provedor", () => {
    const yt = [item("youtube", "y0", 0), item("youtube", "y1", 3), item("youtube", "y2", 7)];
    const tw = [item("twitch", "t0", 0), item("twitch", "t1", 1)];
    expect(interleave([yt, tw]).map((i) => [i.id, i.rank])).toEqual([
      ["youtube:y0", 0], ["twitch:t0", 1], ["youtube:y1", 2], ["twitch:t1", 3], ["youtube:y2", 4],
    ]);
    // Um provedor só: intacto, inclusive com buracos no rank.
    expect(interleave([yt, []]).map((i) => i.rank)).toEqual([0, 3, 7]);
  });

  it("CA8: com pageToken consulta só o YouTube e repassa o próximo token", async () => {
    const yt = fake("youtube", { items: [item("youtube", "a", 0)], nextPageToken: "NEXT_2" });
    const tw = fake("twitch", { items: [item("twitch", "b", 0)] });
    const agg = await createLivesAggregator({ providers: [yt, tw], log: () => {} }).getLives("NEXT_1");
    expect(yt.getLives).toHaveBeenCalledWith({ pageToken: "NEXT_1" });
    expect(tw.getLives).not.toHaveBeenCalled();
    expect(agg.nextPageToken).toBe("NEXT_2");
    expect(agg.sources.map((s) => s.platform)).toEqual(["youtube"]);
  });

  it("D7: metadados agregados usam a fonte mais antiga e marcam stale se alguma estiver vencida", async () => {
    const agg = await createLivesAggregator({
      providers: [
        fake("youtube", { items: [item("youtube", "a", 0)], updatedAt: "2026-11-21T12:00:00.000Z", cached: true }),
        fake("twitch", { items: [item("twitch", "b", 0)], updatedAt: "2026-11-21T11:58:00.000Z", cached: false, stale: true }),
      ],
      log: () => {},
    }).getLives();
    expect(agg).toMatchObject({ updatedAt: "2026-11-21T11:58:00.000Z", cached: false, stale: true });
  });
});
