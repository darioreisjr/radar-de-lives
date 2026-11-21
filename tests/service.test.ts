import { describe, expect, it, vi } from "vitest";
import { MemoryCache } from "@/lib/cache/memory-cache";
import { MemoryCounter, MemoryLock } from "@/lib/store/memory";
import { createYoutubeClient } from "@/lib/youtube/client";
import { LivesError } from "@/lib/youtube/errors";
import { createLivesService, type PageData } from "@/lib/youtube/service";

const KEY = "TEST_KEY_should_never_leak_123";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const searchBody = {
  nextPageToken: "NEXT_1",
  items: [
    { id: { videoId: "aaaaaaaaaaa" }, snippet: { title: "GTA 6 ao vivo", channelTitle: "C", liveBroadcastContent: "live" } },
    { id: { videoId: "aaaaaaaaaaa" }, snippet: { title: "dup", channelTitle: "C", liveBroadcastContent: "live" } },
  ],
};
const videosBody = { items: [{ id: "aaaaaaaaaaa", snippet: { liveBroadcastContent: "live" }, liveStreamingDetails: {} }] };

function setup(opts: { fetchImpl: typeof fetch; budget?: number }) {
  let t = Date.parse("2026-11-21T12:00:00Z");
  const now = () => t;
  const service = createLivesService({
    client: createYoutubeClient({
      apiKey: KEY,
      regionCode: "BR",
      relevanceLanguage: "pt",
      fetchImpl: opts.fetchImpl,
      retryDelayMs: 0,
    }),
    cache: new MemoryCache<PageData>(50, now),
    counter: new MemoryCounter(now),
    lock: new MemoryLock(now),
    sleep: async () => {},
    config: {
      query: "q",
      ttlMs: 120_000,
      staleMs: 600_000,
      minUpstreamIntervalMs: 30_000,
      dailySearchBudget: opts.budget ?? 90,
    },
    now,
    log: () => {},
  });
  return { service, advance: (ms: number) => (t += ms) };
}

function okFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    return url.includes("/search?") ? json(200, searchBody) : json(200, videosBody);
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

describe("serviço de lives", () => {
  it("monta search.list com type=video e eventType=live", async () => {
    const f = okFetch();
    const { service } = setup({ fetchImpl: f });
    await service.getLives();
    const url = new URL(String(f.mock.calls[0][0]));
    expect(url.pathname).toBe("/youtube/v3/search");
    expect(url.searchParams.get("type")).toBe("video");
    expect(url.searchParams.get("eventType")).toBe("live");
    expect(url.searchParams.get("maxResults")).toBe("50");
    const vurl = new URL(String(f.mock.calls[1][0]));
    expect(vurl.searchParams.get("part")).toBe("snippet,liveStreamingDetails,status");
    expect(vurl.searchParams.has("maxResults")).toBe(false);
  });

  it("deduplica, normaliza e devolve nextPageToken", async () => {
    const { service } = setup({ fetchImpl: okFetch() });
    const r = await service.getLives();
    expect(r.items).toHaveLength(1);
    expect(r.items[0].concurrentViewers).toBeNull();
    expect(r.nextPageToken).toBe("NEXT_1");
    expect(r.cached).toBe(false);
  });

  it("dentro do TTL não chama o YouTube de novo (CA8)", async () => {
    const f = okFetch();
    const { service, advance } = setup({ fetchImpl: f });
    await service.getLives();
    advance(60_000);
    const r = await service.getLives();
    expect(r.cached).toBe(true);
    expect(r.stale).toBe(false);
    expect(f).toHaveBeenCalledTimes(2); // search + videos, uma vez só
  });

  it("requisições simultâneas compartilham a mesma busca", async () => {
    const f = okFetch();
    const { service } = setup({ fetchImpl: f });
    await Promise.all([service.getLives(), service.getLives(), service.getLives()]);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("quotaExceeded sem cache vira quota_exceeded (CA7)", async () => {
    const f = vi.fn(async () =>
      json(403, { error: { code: 403, errors: [{ reason: "quotaExceeded", domain: "youtube.quota" }] } }),
    ) as unknown as typeof fetch;
    const { service } = setup({ fetchImpl: f });
    await expect(service.getLives()).rejects.toMatchObject({ code: "quota_exceeded" });
  });

  it("quota após TTL serve cache stale (CA7)", async () => {
    let fail = false;
    const f = vi.fn(async (input: RequestInfo | URL) => {
      if (fail) return json(403, { error: { errors: [{ reason: "quotaExceeded" }] } });
      return String(input).includes("/search?") ? json(200, searchBody) : json(200, videosBody);
    }) as unknown as typeof fetch;
    const { service, advance } = setup({ fetchImpl: f });
    await service.getLives();
    fail = true;
    advance(200_000);
    const r = await service.getLives();
    expect(r.stale).toBe(true);
    expect(r.items).toHaveLength(1);
    advance(600_000); // além do stale
    await expect(service.getLives()).rejects.toMatchObject({ code: "quota_exceeded" });
  });

  it("orçamento diário esgotado bloqueia novas buscas", async () => {
    const f = okFetch();
    const { service } = setup({ fetchImpl: f, budget: 1 });
    await service.getLives();
    await expect(service.getLives("NEXT_1")).rejects.toMatchObject({ code: "quota_exceeded" });
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("timeout/5xx tenta uma vez de novo e depois falha controlado", async () => {
    const f = vi.fn(async () => json(503, {})) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
    const { service } = setup({ fetchImpl: f });
    await expect(service.getLives()).rejects.toMatchObject({ code: "upstream_unavailable" });
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("chave inválida vira upstream_config e não vaza a chave na mensagem", async () => {
    const f = vi.fn(async () =>
      json(400, { error: { message: `API key not valid ${KEY}`, errors: [{ reason: "badRequest" }], details: [{ reason: "API_KEY_INVALID" }] } }),
    ) as unknown as typeof fetch;
    const { service } = setup({ fetchImpl: f });
    const err = (await service.getLives().catch((e) => e)) as LivesError;
    expect(err.code).toBe("upstream_config");
    expect(err.message).not.toContain(KEY);
  });

  it("falha do videos.list mantém itens da busca sem inventar dados", async () => {
    const f = vi.fn(async (input: RequestInfo | URL) =>
      String(input).includes("/search?") ? json(200, searchBody) : json(500, {}),
    ) as unknown as typeof fetch;
    const { service } = setup({ fetchImpl: f });
    const r = await service.getLives();
    expect(r.items[0].embedAllowed).toBe("unknown");
    expect(r.items[0].concurrentViewers).toBeNull();
  });

  it("sem cliente (sem chave) lança missing_api_key", async () => {
    const service = createLivesService({
      client: null,
      cache: new MemoryCache<PageData>(),
      counter: new MemoryCounter(),
      lock: new MemoryLock(),
      config: { query: "q", ttlMs: 1, staleMs: 1, minUpstreamIntervalMs: 1, dailySearchBudget: 1 },
    });
    await expect(service.getLives()).rejects.toMatchObject({ code: "missing_api_key" });
  });
});
