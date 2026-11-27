import { describe, expect, it, vi } from "vitest";
import { MemoryCache } from "@/lib/cache/memory-cache";
import { getServerEnv } from "@/lib/config/server-env";
import { createKickLivesService, type KickPage } from "@/lib/kick/service";
import { getActivePlatforms } from "@/lib/lives/active-platforms";
import { createLivesAggregator } from "@/lib/lives/aggregator";
import { liveId } from "@/lib/lives/identity";
import { createKickProvider, KICK_TIMEOUT_MS } from "@/lib/lives/providers/kick";
import { selectProviders } from "@/lib/lives/providers/select";
import type { LivesProvider } from "@/lib/lives/providers/types";
import type { LiveItem, Platform } from "@/lib/lives/types";
import { MemoryLock } from "@/lib/store/memory";
import type { Lock } from "@/lib/store/types";
import { LivesError } from "@/lib/youtube/errors";

const T0 = Date.parse("2026-11-27T12:00:00Z");

const item = (platform: Platform, id: string, rank: number): LiveItem => ({
  id: liveId(platform, id), platform, sourceId: id,
  title: id, description: "", channelId: "1", channelTitle: "c", thumbnailUrl: null,
  publishedAt: null, liveStartedAt: null, concurrentViewers: 10, language: "pt",
  watchUrl: "", embedUrl: "", isLive: true, embedAllowed: true, isMature: false, rank,
});

function setup(opts: { search?: () => Promise<LiveItem[]>; lock?: Lock; cache?: MemoryCache<KickPage> } = {}) {
  const clock = { t: T0 };
  const now = () => clock.t;
  const search = vi.fn(opts.search ?? (async () => [item("kick", "k0", 0), item("kick", "k1", 1)]));
  const log = vi.fn();
  const service = createKickLivesService({
    search,
    cache: opts.cache ?? new MemoryCache<KickPage>(5, now),
    lock: opts.lock ?? new MemoryLock(now),
    config: { ttlMs: 180_000, staleMs: 600_000, minUpstreamIntervalMs: 30_000 },
    now,
    sleep: async () => {},
    log,
  });
  return { service, search, log, clock };
}

/** YouTube falso que conta chamadas. */
function youtube(): LivesProvider & { calls: () => number } {
  let n = 0;
  return {
    platform: "youtube",
    isConfigured: () => true,
    getLives: async () => {
      n++;
      return { items: [item("youtube", "y0", 0), item("youtube", "y1", 1)], updatedAt: new Date(T0).toISOString(), cached: false, stale: false, nextPageToken: "N" };
    },
    calls: () => n,
  };
}

describe("serviço da Kick (spec 048)", () => {
  it("dentro do TTL usa o cache, sem nova busca; depois do TTL busca de novo", async () => {
    const { service, search, clock, log } = setup();
    expect(await service.getLives()).toMatchObject({ cached: false, stale: false, nextPageToken: null });
    expect(log).toHaveBeenCalledWith("kick_call", { items: 2 });
    clock.t += 179_000;
    expect(await service.getLives()).toMatchObject({ cached: true, stale: false });
    expect(search).toHaveBeenCalledTimes(1);
    clock.t += 31_000; // passou do TTL e da trava
    expect(await service.getLives()).toMatchObject({ cached: false });
    expect(search).toHaveBeenCalledTimes(2);
  });

  it("CA3: requisições simultâneas com cache vazio geram uma busca", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const { service, search } = setup({ search: async () => (await gate, [item("kick", "k0", 0)]) });
    const all = Promise.all([service.getLives(), service.getLives(), service.getLives()]);
    release();
    await all;
    expect(search).toHaveBeenCalledTimes(1);
  });

  it("CA4: Kick fora do ar (ou 429) com cache vencido → serve o cache marcado como stale", async () => {
    let fail = false;
    const { service, clock, log } = setup({
      search: async () => {
        if (fail) throw new LivesError("rate_limited", 60);
        return [item("kick", "k0", 0)];
      },
    });
    await service.getLives();
    fail = true;
    clock.t += 200_000; // venceu o TTL, ainda dentro do cache vencido
    const r = await service.getLives();
    expect(r).toMatchObject({ cached: true, stale: true });
    expect(r.items.map((i) => i.id)).toEqual(["kick:k0"]);
    expect(log).toHaveBeenCalledWith("stale_served", { platform: "kick", code: "rate_limited", ageSeconds: 200 });
  });

  it("sem cache e com falha, o erro sobe", async () => {
    const { service } = setup({ search: async () => Promise.reject(new LivesError("upstream_config")) });
    await expect(service.getLives()).rejects.toMatchObject({ code: "upstream_config" });
  });

  it("outra instância com a trava: espera o cache novo dela", async () => {
    const cache = new MemoryCache<KickPage>(5, () => T0);
    const busy: Lock = { acquire: async () => false };
    let polls = 0;
    const realGet = cache.get.bind(cache);
    cache.get = async (k: string) => {
      if (++polls === 3) await cache.set(k, { value: { items: [item("kick", "outra", 0)] }, storedAt: T0 + 1 }, 60_000);
      return realGet(k);
    };
    const { service, search } = setup({ lock: busy, cache });
    const r = await service.getLives();
    expect(search).not.toHaveBeenCalled();
    expect(r.items.map((i) => i.sourceId)).toEqual(["outra"]);
  });

  it("falha do store fecha sem chamar a Kick (D3)", async () => {
    const cache = new MemoryCache<KickPage>(5, () => T0);
    cache.get = async () => Promise.reject(new Error("redis fora"));
    const { service, search, log } = setup({ cache });
    await expect(service.getLives()).rejects.toMatchObject({ code: "upstream_unavailable" });
    expect(search).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("store_error", { operation: "cache.get", platform: "kick" });
  });
});

describe("Kick no agregador (spec 048)", () => {
  it("CA1: sem kick em LIVES_PROVIDERS, nenhuma chamada à Kick", async () => {
    const { service, search } = setup();
    const { providers } = selectProviders(["youtube"], { youtube: youtube(), kick: createKickProvider(service) });
    await createLivesAggregator({ providers, log: () => {} }).getLives();
    expect(search).not.toHaveBeenCalled();
  });

  it("CA1: kick listada sem credenciais fica de fora", () => {
    const r = selectProviders(["youtube", "kick"], { youtube: youtube(), kick: createKickProvider(null) });
    expect(r.providers.map((p) => p.platform)).toEqual(["youtube"]);
    expect(r.disabled).toEqual([{ platform: "kick", reason: "not_configured" }]);
  });

  it("CA2 e CA6: com kick ativa, lista intercalada e YouTube chamado uma vez como antes", async () => {
    const { service } = setup();
    const yt = youtube();
    const { providers } = selectProviders(["youtube", "kick"], { youtube: yt, kick: createKickProvider(service) });
    const r = await createLivesAggregator({ providers, log: () => {} }).getLives();
    expect(r.items.map((i) => i.id)).toEqual(["youtube:y0", "kick:k0", "youtube:y1", "kick:k1"]);
    expect(r.sources.map((s) => [s.platform, s.ok])).toEqual([["youtube", true], ["kick", true]]);
    expect(r.nextPageToken).toBe("N");
    expect(yt.calls()).toBe(1);
  });

  it("três plataformas: YouTube, Twitch e Kick intercaladas na ordem de LIVES_PROVIDERS", async () => {
    const { service } = setup();
    const twitch: LivesProvider = {
      platform: "twitch",
      isConfigured: () => true,
      getLives: async () => ({ items: [item("twitch", "t0", 0)], updatedAt: new Date(T0).toISOString(), cached: false, stale: false, nextPageToken: null }),
    };
    const { providers } = selectProviders(["youtube", "twitch", "kick"], { youtube: youtube(), twitch, kick: createKickProvider(service) });
    const r = await createLivesAggregator({ providers, log: () => {} }).getLives();
    expect(r.items.map((i) => i.id)).toEqual(["youtube:y0", "twitch:t0", "kick:k0", "youtube:y1", "kick:k1"]);
  });

  it("CA4: Kick com cache vencido aparece como stale em sources", async () => {
    let fail = false;
    const { service, clock } = setup({
      search: async () => {
        if (fail) throw new LivesError("upstream_unavailable");
        return [item("kick", "k0", 0)];
      },
    });
    const agg = createLivesAggregator({ providers: [youtube(), createKickProvider(service)], log: () => {} });
    await agg.getLives();
    fail = true;
    clock.t += 200_000;
    const r = await agg.getLives();
    expect(r.sources[1]).toMatchObject({ platform: "kick", ok: true, stale: true });
    expect(r.stale).toBe(true);
  });

  it("CA5: Kick fora do ar sem cache → YouTube aparece e a Kick fica ok: false", async () => {
    const { service } = setup({ search: async () => Promise.reject(new LivesError("upstream_config")) });
    const r = await createLivesAggregator({ providers: [youtube(), createKickProvider(service)], log: () => {} }).getLives();
    expect(r.items.map((i) => i.platform)).toEqual(["youtube", "youtube"]);
    expect(r.sources[1]).toMatchObject({ platform: "kick", ok: false, errorCode: "upstream_config" });
  });

  it("D5: timeout de 12 s no agregador e ainda sem revalidação de status (#51)", () => {
    const p = createKickProvider(null);
    expect(p.timeoutMs).toBe(KICK_TIMEOUT_MS);
    expect(KICK_TIMEOUT_MS).toBe(12_000);
    expect(p.status).toBeUndefined();
  });
});

describe("configuração da Kick (spec 048 D2, D7)", () => {
  it("cache: padrões 180 s e 600 s; fora dos limites é cortado (máx. 2 h no total)", () => {
    vi.stubEnv("KICK_CACHE_TTL_SECONDS", "");
    vi.stubEnv("KICK_STALE_TTL_SECONDS", "");
    expect(getServerEnv()).toMatchObject({ kickCacheTtlSeconds: 180, kickStaleTtlSeconds: 600 });
    vi.stubEnv("KICK_CACHE_TTL_SECONDS", "999999");
    vi.stubEnv("KICK_STALE_TTL_SECONDS", "999999");
    const env = getServerEnv();
    expect(env.kickCacheTtlSeconds + env.kickStaleTtlSeconds).toBeLessThanOrEqual(7_200);
    vi.stubEnv("KICK_CACHE_TTL_SECONDS", "1");
    expect(getServerEnv().kickCacheTtlSeconds).toBe(30);
    vi.unstubAllEnvs();
  });

  it("textos do site: a Kick só entra nas plataformas ativas com credenciais", () => {
    const env = (providers: string, creds: boolean) => {
      vi.stubEnv("LIVES_PROVIDERS", providers);
      vi.stubEnv("TWITCH_CLIENT_ID", "");
      vi.stubEnv("TWITCH_CLIENT_SECRET", "");
      vi.stubEnv("KICK_CLIENT_ID", creds ? "id" : "");
      vi.stubEnv("KICK_CLIENT_SECRET", creds ? "segredo" : "");
    };
    env("youtube,kick", false);
    expect(getActivePlatforms()).toEqual(["youtube"]);
    env("youtube,kick", true);
    expect(getActivePlatforms()).toEqual(["youtube", "kick"]);
    env("youtube", true);
    expect(getActivePlatforms()).toEqual(["youtube"]);
    vi.unstubAllEnvs();
  });
});
