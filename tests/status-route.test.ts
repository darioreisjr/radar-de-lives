import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { GET as legacyGET } from "@/app/api/lives/[videoId]/route";
import { GET as statusGET } from "@/app/api/status/[platform]/[id]/route";
import { MemoryCache } from "@/lib/cache/memory-cache";
import type { LivesProvider } from "@/lib/lives/providers/types";
import { createYoutubeProvider } from "@/lib/lives/providers/youtube";
import { createStatusHandler } from "@/lib/lives/status-handler";
import { createRateLimiter } from "@/lib/rate-limit/rate-limiter";
import { MemoryCounter } from "@/lib/store/memory";
import { createYoutubeClient } from "@/lib/youtube/client";
import { LivesError } from "@/lib/youtube/errors";
import type { LivesService } from "@/lib/youtube/service";
import { createVideoStatusService } from "@/lib/youtube/video-status";

const ID = "aaaaaaaaaaa";
const T0 = Date.parse("2026-11-21T12:00:00Z");
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function setup(opts: { limit?: number; extra?: LivesProvider[] } = {}) {
  const now = () => T0;
  const fetchImpl = vi.fn(async () =>
    json(200, {
      items: [{ id: ID, snippet: { liveBroadcastContent: "live" }, liveStreamingDetails: { concurrentViewers: "42" }, status: { embeddable: true } }],
    }),
  ) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
  const statusService = createVideoStatusService({
    client: createYoutubeClient({ apiKey: "K", regionCode: "BR", relevanceLanguage: "pt", fetchImpl, retryDelayMs: 0 }),
    cache: new MemoryCache(50, now),
    counter: new MemoryCounter(now),
    ttlMs: 60_000,
    dailyBudget: 100,
    now,
    log: () => {},
  });
  const yt = createYoutubeProvider({ getLives: vi.fn() } as unknown as LivesService, true, statusService);
  const limiter = createRateLimiter({ counter: new MemoryCounter(now), limit: opts.limit ?? 30, windowMs: 60_000, secret: "s" });
  const log = vi.fn();
  const handle = createStatusHandler({ rateLimit: () => limiter, providers: () => [yt, ...(opts.extra ?? [])], log });
  const req = () => new Request("http://localhost/x", { headers: { "x-forwarded-for": "203.0.113.7" } });
  return { handle, fetchImpl, statusService, req, log };
}

const NEW = { route: "/api/status/[platform]/[id]" };
const OLD = { idLabel: "videoId", route: "/api/lives/[videoId]" };

describe("rota de status por plataforma (spec 024)", () => {
  it("CA1: /api/status/youtube/<id> devolve o mesmo que a rota antiga, com platform e sourceId a mais", async () => {
    const a = setup();
    const novo = await a.handle(a.req(), "youtube", ID, NEW);
    const b = setup();
    const antigo = await b.handle(b.req(), "youtube", ID, OLD);
    const direto = await setup().statusService.getStatus(ID); // o que a rota antiga devolvia antes da 024
    const bodyNovo = await novo.json();
    expect(novo.status).toBe(200);
    expect(bodyNovo).toEqual(await antigo.json());
    expect(bodyNovo).toEqual({ ...direto, platform: "youtube", sourceId: ID });
    expect(novo.headers.get("cache-control")).toBe("no-store");
  });

  it("CA2: plataforma inexistente, inativa ou sem revalidação → 400 sem chamar provedor", async () => {
    const semStatus: LivesProvider = { platform: "kick", isConfigured: () => true, getLives: vi.fn() };
    const s = setup({ extra: [semStatus] });
    for (const platform of ["foo", "twitch", "kick"]) {
      const res = await s.handle(s.req(), platform, ID, NEW);
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: { code: "invalid_params", message: "Parâmetros inválidos: plataforma inválida" } });
    }
    expect(s.fetchImpl).not.toHaveBeenCalled();
  });

  it("CA3: id inválido → 400 sem chamar provedor; a rota antiga mantém a mensagem de antes", async () => {
    const s = setup();
    const novo = await s.handle(s.req(), "youtube", "x!", NEW);
    expect(novo.status).toBe(400);
    expect(await novo.json()).toMatchObject({ error: { message: "Parâmetros inválidos: id inválido" } });
    const antigo = await s.handle(s.req(), "youtube", "x!", OLD);
    expect(await antigo.json()).toMatchObject({ error: { code: "invalid_params", message: "Parâmetros inválidos: videoId inválido" } });
    expect(s.fetchImpl).not.toHaveBeenCalled();
  });

  it("CA4: rate limit compartilhado com 429, Retry-After e no-store", async () => {
    const s = setup({ limit: 2 });
    expect((await s.handle(s.req(), "youtube", ID, NEW)).status).toBe(200);
    expect((await s.handle(s.req(), "youtube", ID, OLD)).status).toBe(200);
    const res = await s.handle(s.req(), "youtube", ID, NEW);
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toMatchObject({ error: { code: "rate_limited" } });
  });

  it("CA5: erros do provedor viram as mesmas respostas de hoje", async () => {
    const quota: LivesProvider = {
      platform: "twitch",
      isConfigured: () => true,
      getLives: vi.fn(),
      status: { isValidId: () => true, getStatus: async () => Promise.reject(new LivesError("quota_exceeded")) },
    };
    const quebrado: LivesProvider = {
      platform: "kick",
      isConfigured: () => true,
      getLives: vi.fn(),
      status: { isValidId: () => true, getStatus: async () => Promise.reject(new Error("boom")) },
    };
    const s = setup({ extra: [quota, quebrado] });
    const r1 = await s.handle(s.req(), "twitch", "canal", NEW);
    expect(r1.status).toBe(503);
    expect(await r1.json()).toMatchObject({ error: { code: "quota_exceeded" } });
    const r2 = await s.handle(s.req(), "kick", "canal", NEW);
    expect(r2.status).toBe(502);
    expect(await r2.json()).toMatchObject({ error: { code: "upstream_unavailable" } });
    expect(s.log).toHaveBeenCalledWith("route_error", { route: "/api/status/[platform]/[id]" });
  });

  it("rotas reais (sem chave do YouTube): as duas respondem igual e a nova recusa plataforma inativa", async () => {
    vi.stubEnv("YOUTUBE_API_KEY", "");
    vi.stubEnv("LIVES_PROVIDERS", "");
    try {
      const ctxNew = { params: Promise.resolve({ platform: "youtube", id: ID }) };
      const ctxOld = { params: Promise.resolve({ videoId: ID }) };
      const rNew = await statusGET(new NextRequest(`http://localhost/api/status/youtube/${ID}`), ctxNew);
      const rOld = await legacyGET(new NextRequest(`http://localhost/api/lives/${ID}`), ctxOld);
      expect(rNew.status).toBe(503);
      expect(await rNew.json()).toEqual(await rOld.json());
      const inativa = await statusGET(new NextRequest(`http://localhost/api/status/twitch/x`), {
        params: Promise.resolve({ platform: "twitch", id: "x" }),
      });
      expect(inativa.status).toBe(400);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
