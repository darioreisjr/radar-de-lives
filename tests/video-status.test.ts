import { describe, expect, it, vi } from "vitest";
import { MemoryCache } from "@/lib/cache/memory-cache";
import { MemoryCounter } from "@/lib/store/memory";
import { createYoutubeClient } from "@/lib/youtube/client";
import { createVideoStatusService, videoStatusFrom } from "@/lib/youtube/video-status";

const ID = "aaaaaaaaaaa";
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("videoStatusFrom (CA4)", () => {
  it("mapeia live, encerrada, agendada e indisponível", () => {
    expect(videoStatusFrom(ID, { id: ID, snippet: { liveBroadcastContent: "live" }, liveStreamingDetails: { concurrentViewers: "42" }, status: { embeddable: true } })).toEqual({
      videoId: ID, state: "live", embedAllowed: true, concurrentViewers: 42,
    });
    expect(videoStatusFrom(ID, { id: ID, snippet: { liveBroadcastContent: "live" }, liveStreamingDetails: { actualEndTime: "2026-11-21T12:00:00Z" } }).state).toBe("ended");
    expect(videoStatusFrom(ID, { id: ID, snippet: { liveBroadcastContent: "none" } }).state).toBe("ended");
    expect(videoStatusFrom(ID, { id: ID, snippet: { liveBroadcastContent: "upcoming" } }).state).toBe("upcoming");
    expect(videoStatusFrom(ID, undefined)).toMatchObject({ state: "unavailable", concurrentViewers: null });
  });
  it("audiência ausente = null; encerrada não mostra audiência", () => {
    expect(videoStatusFrom(ID, { id: ID, snippet: { liveBroadcastContent: "live" } }).concurrentViewers).toBeNull();
    expect(videoStatusFrom(ID, { id: ID, snippet: { liveBroadcastContent: "none" }, liveStreamingDetails: { concurrentViewers: "9" } }).concurrentViewers).toBeNull();
  });
  it("embeddable ausente = unknown; false preservado", () => {
    expect(videoStatusFrom(ID, { id: ID, snippet: { liveBroadcastContent: "live" } }).embedAllowed).toBe("unknown");
    expect(videoStatusFrom(ID, { id: ID, snippet: { liveBroadcastContent: "live" }, status: { embeddable: false } }).embedAllowed).toBe(false);
  });
});

function setup(fetchImpl: typeof fetch, budget = 100) {
  let t = Date.parse("2026-11-21T12:00:00Z");
  const now = () => t;
  const service = createVideoStatusService({
    client: createYoutubeClient({ apiKey: "K", regionCode: "BR", relevanceLanguage: "pt", fetchImpl, retryDelayMs: 0 }),
    cache: new MemoryCache(50, now),
    counter: new MemoryCounter(now),
    ttlMs: 60_000,
    dailyBudget: budget,
    now,
    log: () => {},
  });
  return { service, advance: (ms: number) => (t += ms) };
}

describe("serviço de revalidação", () => {
  it("usa videos.list com o id e cacheia por 60 s (CA5)", async () => {
    const f = vi.fn(async () => json(200, { items: [{ id: ID, snippet: { liveBroadcastContent: "live" } }] }));
    const { service, advance } = setup(f as unknown as typeof fetch);
    const a = await service.getStatus(ID);
    expect(a.cached).toBe(false);
    const url = new URL(String((f.mock.calls[0] as unknown[])[0]));
    expect(url.pathname).toBe("/youtube/v3/videos");
    expect(url.searchParams.get("id")).toBe(ID);
    advance(30_000);
    expect((await service.getStatus(ID)).cached).toBe(true);
    advance(31_000);
    await service.getStatus(ID);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("orçamento esgotado vira quota_exceeded", async () => {
    const f = vi.fn(async () => json(200, { items: [] }));
    const { service } = setup(f as unknown as typeof fetch, 1);
    await service.getStatus(ID);
    await expect(service.getStatus("bbbbbbbbbbb")).rejects.toMatchObject({ code: "quota_exceeded" });
  });

  it("quota do YouTube vira quota_exceeded", async () => {
    const f = vi.fn(async () => json(403, { error: { errors: [{ reason: "quotaExceeded" }] } }));
    const { service } = setup(f as unknown as typeof fetch);
    await expect(service.getStatus(ID)).rejects.toMatchObject({ code: "quota_exceeded" });
  });

  it("sem chave: missing_api_key", async () => {
    const service = createVideoStatusService({ client: null, cache: new MemoryCache(), counter: new MemoryCounter(), ttlMs: 1, dailyBudget: 1 });
    await expect(service.getStatus(ID)).rejects.toMatchObject({ code: "missing_api_key" });
  });
});
