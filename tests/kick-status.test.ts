import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { MemoryCache } from "@/lib/cache/memory-cache";
import type { KickClient } from "@/lib/kick/client";
import type { KickLivesService } from "@/lib/kick/service";
import { createKickStatusService, KICK_SLUG, type KickStatusData } from "@/lib/kick/status";
import { createKickProvider } from "@/lib/lives/providers/kick";
import { createStatusHandler } from "@/lib/lives/status-handler";
import { createRateLimiter } from "@/lib/rate-limit/rate-limiter";
import { MemoryCounter } from "@/lib/store/memory";
import { LivesError } from "@/lib/youtube/errors";

const T0 = Date.parse("2026-11-27T12:00:00Z");
const STREAM_KEY = "sk_us-west-2_SEGREDO_do_streamer";
const STREAM_URL = "rtmps://stream.kick.com/app/SEGREDO";

/** Formato de GET /public/v1/channels (spec OpenAPI da Kick), com campos sensíveis do streamer. */
const channel = (slug: string, stream: Record<string, unknown> | null) => ({
  data: [
    {
      slug,
      broadcaster_user_id: 1000001,
      stream_title: "GTA 6",
      channel_description: "",
      active_subscribers_count: 3,
      category: { id: 13155, name: "Grand Theft Auto VI (GTA)", thumbnail: "" },
      stream: stream && { key: STREAM_KEY, url: STREAM_URL, language: "en", is_mature: true, thumbnail: "", start_time: "2026-11-27T10:00:00Z", ...stream },
    },
  ],
  message: "OK",
});

const liveReply = (slug: string) => channel(slug, { is_live: true, viewer_count: 777 });

function setup(reply: (slug: string) => unknown) {
  const clock = { t: T0 };
  const api = vi.fn(async <T,>(_path: string, params: Record<string, string | readonly string[]>, schema: z.ZodType<T>) =>
    schema.parse(await reply(params.slug as string)),
  );
  const client = { api } as unknown as KickClient;
  const service = createKickStatusService({
    client,
    cache: new MemoryCache<KickStatusData>(50, () => clock.t),
    ttlMs: 60_000,
    now: () => clock.t,
    log: () => {},
  });
  return { service, api, clock };
}

describe("revalidação da Kick (spec 049)", () => {
  it("CA1: canal ao vivo → live com espectadores atualizados, pelo slug", async () => {
    const { service, api } = setup(liveReply);
    const r = await service.getStatus("Canal-X");
    expect(r).toEqual({
      platform: "kick",
      sourceId: "canal-x",
      state: "live",
      embedAllowed: true,
      concurrentViewers: 777,
      checkedAt: new Date(T0).toISOString(),
      cached: false,
    });
    expect(api.mock.calls[0][0]).toBe("v1/channels");
    expect(api.mock.calls[0][1]).toEqual({ slug: "canal-x" });
  });

  it("CA2: canal offline (is_live falso ou sem stream) → ended, sem espectadores", async () => {
    for (const stream of [{ is_live: false, viewer_count: 0 }, null, {}]) {
      const { service } = setup((slug) => channel(slug, stream));
      expect(await service.getStatus("canal_x")).toMatchObject({ state: "ended", concurrentViewers: null });
    }
  });

  it("D3: slug não encontrado (lista vazia) → unavailable", async () => {
    const { service } = setup(() => ({ data: [] }));
    expect(await service.getStatus("sumiu")).toMatchObject({ state: "unavailable", concurrentViewers: null });
  });

  it("CA2: viewer_count ausente no canal ao vivo vira null, nunca 0", async () => {
    const { service } = setup((slug) => channel(slug, { is_live: true }));
    expect(await service.getStatus("canal_x")).toMatchObject({ state: "live", concurrentViewers: null });
  });

  it("CA3: formato de slug válido (até 25 caracteres, letras, números, _ e -)", () => {
    for (const ok of ["canal_x", "canal-x", "a", "A1_b-2", "x".repeat(25)]) expect(KICK_SLUG.test(ok)).toBe(true);
    for (const bad of ["", "x".repeat(26), "canal x", "canal.x", "../a", "canal%20x", "ç"]) expect(KICK_SLUG.test(bad)).toBe(false);
  });

  it("CA4: cache de 60 s por canal e single-flight", async () => {
    const { service, api, clock } = setup(liveReply);
    await Promise.all([service.getStatus("canal_x"), service.getStatus("CANAL_X")]);
    expect(api).toHaveBeenCalledTimes(1);
    clock.t += 59_000;
    expect(await service.getStatus("canal_x")).toMatchObject({ cached: true });
    expect(api).toHaveBeenCalledTimes(1);
    clock.t += 2_000;
    expect(await service.getStatus("canal_x")).toMatchObject({ cached: false });
    expect(api).toHaveBeenCalledTimes(2);
  });

  it("CA5: a resposta e o cache nunca levam a chave nem o endereço de transmissão", async () => {
    const cache = new MemoryCache<KickStatusData>(50, () => T0);
    const api = vi.fn(async <T,>(_p: string, params: Record<string, string | readonly string[]>, schema: z.ZodType<T>) =>
      schema.parse(liveReply(params.slug as string)),
    );
    const service = createKickStatusService({ client: { api } as unknown as KickClient, cache, ttlMs: 60_000, now: () => T0, log: () => {} });
    const r = await service.getStatus("canal_x");
    const guardado = await cache.get("canal_x");
    for (const dump of [JSON.stringify(r), JSON.stringify(guardado)]) {
      expect(dump).not.toContain(STREAM_KEY);
      expect(dump).not.toContain("rtmps://");
      expect(dump).not.toContain("SEGREDO");
    }
  });

  it("erro do cliente sobe (o handler transforma na resposta de sempre)", async () => {
    const { service } = setup(() => {
      throw new LivesError("rate_limited", 7);
    });
    await expect(service.getStatus("canal_x")).rejects.toMatchObject({ code: "rate_limited", retryAfterSeconds: 7 });
  });

  it("store fora: fecha sem chamar a Kick", async () => {
    const cache = new MemoryCache<KickStatusData>(50, () => T0);
    cache.get = async () => Promise.reject(new Error("redis fora"));
    const api = vi.fn();
    const log = vi.fn();
    const service = createKickStatusService({ client: { api } as unknown as KickClient, cache, ttlMs: 60_000, now: () => T0, log });
    await expect(service.getStatus("canal_x")).rejects.toMatchObject({ code: "upstream_unavailable" });
    expect(api).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("store_error", { operation: "cache.get", platform: "kick" });
  });
});

describe("rota /api/status/kick/<slug> (spec 049)", () => {
  const limiter = () => createRateLimiter({ counter: new MemoryCounter(() => T0), limit: 30, windowMs: 60_000, secret: "s" });
  const req = () => new Request("http://localhost/x", { headers: { "x-forwarded-for": "203.0.113.9" } });
  const lives = { getLives: vi.fn() } as unknown as KickLivesService;
  const R = { route: "/api/status/[platform]/[id]" };

  it("Kick ativa: responde live; slug inválido → 400 sem chamar a Kick (CA3)", async () => {
    const { service, api } = setup(liveReply);
    const rl = limiter();
    const handle = createStatusHandler({ rateLimit: () => rl, providers: () => [createKickProvider(lives, service)], log: () => {} });
    const ok = await handle(req(), "kick", "canal-x", R);
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(body).toMatchObject({ platform: "kick", sourceId: "canal-x", state: "live", concurrentViewers: 777 });
    expect(JSON.stringify(body)).not.toContain(STREAM_KEY);
    for (const bad of ["canal x", "x".repeat(26), "canal.x"]) {
      const r = await handle(req(), "kick", bad, R);
      expect(r.status).toBe(400);
      expect(await r.json()).toMatchObject({ error: { code: "invalid_params" } });
    }
    expect(api).toHaveBeenCalledTimes(1);
  });

  it("Kick sem revalidação ou inativa → 400", async () => {
    const rl = limiter();
    const semStatus = createStatusHandler({ rateLimit: () => rl, providers: () => [createKickProvider(lives, null)], log: () => {} });
    expect((await semStatus(req(), "kick", "canal_x", R)).status).toBe(400);
    const inativa = createStatusHandler({ rateLimit: () => rl, providers: () => [], log: () => {} });
    expect((await inativa(req(), "kick", "canal_x", R)).status).toBe(400);
  });
});
