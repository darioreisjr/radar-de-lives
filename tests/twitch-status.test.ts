import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { MemoryCache } from "@/lib/cache/memory-cache";
import { createTwitchProvider } from "@/lib/lives/providers/twitch";
import { createStatusHandler } from "@/lib/lives/status-handler";
import { createRateLimiter } from "@/lib/rate-limit/rate-limiter";
import { MemoryCounter } from "@/lib/store/memory";
import type { TwitchClient } from "@/lib/twitch/client";
import type { TwitchLivesService } from "@/lib/twitch/service";
import { createTwitchStatusService, TWITCH_LOGIN, type TwitchStatusData } from "@/lib/twitch/status";
import { LivesError } from "@/lib/youtube/errors";

const T0 = Date.parse("2026-11-25T12:00:00Z");

function setup(reply: (login: string) => unknown) {
  const clock = { t: T0 };
  const helix = vi.fn(async <T,>(_path: string, params: Record<string, string | readonly string[]>, schema: z.ZodType<T>) =>
    schema.parse(await reply(params.user_login as string)),
  );
  const client = { helix, rateLimit: () => null } as unknown as TwitchClient;
  const service = createTwitchStatusService({
    client,
    cache: new MemoryCache<TwitchStatusData>(50, () => clock.t),
    ttlMs: 60_000,
    now: () => clock.t,
    log: () => {},
  });
  return { service, helix, clock };
}

const liveReply = (login: string) => ({ data: [{ user_login: login, type: "live", viewer_count: 777 }] });

describe("revalidação da Twitch (spec 030)", () => {
  it("CA1: canal ao vivo → live com espectadores atualizados", async () => {
    const { service, helix } = setup(liveReply);
    const r = await service.getStatus("Canal_X");
    expect(r).not.toHaveProperty("videoId"); // spec 053
    expect(r).toMatchObject({
      platform: "twitch",
      sourceId: "canal_x",
      state: "live",
      embedAllowed: true,
      concurrentViewers: 777,
      cached: false,
    });
    expect(helix.mock.calls[0][0]).toBe("streams");
    expect(helix.mock.calls[0][1]).toEqual({ user_login: "canal_x", type: "live" });
  });

  it("CA2: canal offline (lista vazia) → ended, sem espectadores", async () => {
    const { service } = setup(() => ({ data: [] }));
    expect(await service.getStatus("canal_x")).toMatchObject({ state: "ended", concurrentViewers: null });
  });

  it("CA3: formato de login válido", () => {
    for (const ok of ["canal_x", "Canal123", "a", "x".repeat(25)]) expect(TWITCH_LOGIN.test(ok)).toBe(true);
    for (const bad of ["", "x".repeat(26), "canal-x", "canal x", "canal!", "../x"]) expect(TWITCH_LOGIN.test(bad)).toBe(false);
  });

  it("CA4: cache de 60 s por canal e single-flight", async () => {
    const { service, helix, clock } = setup(liveReply);
    await Promise.all([service.getStatus("canal_x"), service.getStatus("CANAL_X")]);
    expect(helix).toHaveBeenCalledTimes(1);
    clock.t += 59_000;
    expect(await service.getStatus("canal_x")).toMatchObject({ cached: true });
    expect(helix).toHaveBeenCalledTimes(1);
    clock.t += 2_000;
    expect(await service.getStatus("canal_x")).toMatchObject({ cached: false });
    expect(helix).toHaveBeenCalledTimes(2);
  });

  it("erro do cliente sobe (o handler transforma na resposta de sempre)", async () => {
    const { service } = setup(() => {
      throw new LivesError("rate_limited", 7);
    });
    await expect(service.getStatus("canal_x")).rejects.toMatchObject({ code: "rate_limited", retryAfterSeconds: 7 });
  });
});

describe("rota /api/status/twitch/<login> (spec 030 CA5)", () => {
  const limiter = () => createRateLimiter({ counter: new MemoryCounter(() => T0), limit: 30, windowMs: 60_000, secret: "s" });
  const req = () => new Request("http://localhost/x", { headers: { "x-forwarded-for": "203.0.113.9" } });
  const lives = { getLives: vi.fn() } as unknown as TwitchLivesService;

  it("Twitch ativa: responde live; login inválido → 400 sem chamar a Twitch", async () => {
    const { service, helix } = setup(liveReply);
    const rl = limiter();
    const handle = createStatusHandler({ rateLimit: () => rl, providers: () => [createTwitchProvider(lives, service)], log: () => {} });
    const ok = await handle(req(), "twitch", "canal_x", { route: "/api/status/[platform]/[id]" });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ platform: "twitch", state: "live", concurrentViewers: 777 });
    const bad = await handle(req(), "twitch", "canal-x", { route: "/api/status/[platform]/[id]" });
    expect(bad.status).toBe(400);
    expect(helix).toHaveBeenCalledTimes(1);
  });

  it("Twitch sem revalidação ou inativa → 400", async () => {
    const rl = limiter();
    const semStatus = createStatusHandler({ rateLimit: () => rl, providers: () => [createTwitchProvider(lives, null)], log: () => {} });
    expect((await semStatus(req(), "twitch", "canal_x", { route: "r" })).status).toBe(400);
    const inativa = createStatusHandler({ rateLimit: () => rl, providers: () => [], log: () => {} });
    expect((await inativa(req(), "twitch", "canal_x", { route: "r" })).status).toBe(400);
  });
});
