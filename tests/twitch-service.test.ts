import { describe, expect, it, vi } from "vitest";
import { MemoryCache } from "@/lib/cache/memory-cache";
import { getServerEnv } from "@/lib/config/server-env";
import { createLivesAggregator } from "@/lib/lives/aggregator";
import { liveId } from "@/lib/lives/identity";
import { selectProviders } from "@/lib/lives/providers/select";
import { createTwitchProvider, TWITCH_TIMEOUT_MS } from "@/lib/lives/providers/twitch";
import type { LivesProvider } from "@/lib/lives/providers/types";
import type { LiveItem, Platform } from "@/lib/lives/types";
import { MemoryLock } from "@/lib/store/memory";
import type { Lock } from "@/lib/store/types";
import { createTwitchLivesService, type TwitchPage } from "@/lib/twitch/service";
import { LivesError } from "@/lib/youtube/errors";

const T0 = Date.parse("2026-11-25T12:00:00Z");

const item = (platform: Platform, id: string, rank: number): LiveItem => ({
  id: liveId(platform, id), platform, sourceId: id, videoId: id,
  title: id, description: "", channelId: "c", channelTitle: "c", thumbnailUrl: null,
  publishedAt: null, liveStartedAt: null, concurrentViewers: 10, language: "pt",
  watchUrl: "", embedUrl: "", isLive: true, embedAllowed: true, isMature: false, rank,
});

function setup(opts: { search?: () => Promise<LiveItem[]>; lock?: Lock; cache?: MemoryCache<TwitchPage> } = {}) {
  const clock = { t: T0 };
  const now = () => clock.t;
  const search = vi.fn(opts.search ?? (async () => [item("twitch", "t0", 0), item("twitch", "t1", 1)]));
  const log = vi.fn();
  const service = createTwitchLivesService({
    search,
    cache: opts.cache ?? new MemoryCache<TwitchPage>(5, now),
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

describe("serviço da Twitch (spec 029)", () => {
  it("dentro do TTL usa o cache, sem nova busca; depois do TTL busca de novo", async () => {
    const { service, search, clock } = setup();
    const a = await service.getLives();
    expect(a).toMatchObject({ cached: false, stale: false, nextPageToken: null });
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
    const { service, search } = setup({ search: async () => (await gate, [item("twitch", "t0", 0)]) });
    const all = Promise.all([service.getLives(), service.getLives(), service.getLives()]);
    release();
    await all;
    expect(search).toHaveBeenCalledTimes(1);
  });

  it("CA4: Twitch fora do ar com cache vencido → serve o cache marcado como stale", async () => {
    let fail = false;
    const { service, clock, log } = setup({
      search: async () => {
        if (fail) throw new LivesError("rate_limited", 5);
        return [item("twitch", "t0", 0)];
      },
    });
    await service.getLives();
    fail = true;
    clock.t += 200_000; // venceu o TTL, ainda dentro do cache vencido
    const r = await service.getLives();
    expect(r).toMatchObject({ cached: true, stale: true });
    expect(r.items.map((i) => i.id)).toEqual(["twitch:t0"]);
    expect(log).toHaveBeenCalledWith("stale_served", { platform: "twitch", code: "rate_limited", ageSeconds: 200 });
  });

  it("sem cache e com falha, o erro sobe", async () => {
    const { service } = setup({ search: async () => Promise.reject(new LivesError("upstream_config")) });
    await expect(service.getLives()).rejects.toMatchObject({ code: "upstream_config" });
  });

  it("outra instância com a trava: espera o cache novo dela", async () => {
    const cache = new MemoryCache<TwitchPage>(5, () => T0);
    const busy: Lock = { acquire: async () => false };
    let polls = 0;
    const realGet = cache.get.bind(cache);
    cache.get = async (k: string) => {
      if (++polls === 3) await cache.set(k, { value: { items: [item("twitch", "outra", 0)] }, storedAt: T0 + 1 }, 60_000);
      return realGet(k);
    };
    const { service, search } = setup({ lock: busy, cache });
    const r = await service.getLives();
    expect(search).not.toHaveBeenCalled();
    expect(r.items.map((i) => i.sourceId)).toEqual(["outra"]);
  });

  it("falha do store fecha sem chamar a Twitch (D3)", async () => {
    const cache = new MemoryCache<TwitchPage>(5, () => T0);
    cache.get = async () => Promise.reject(new Error("redis fora"));
    const { service, search } = setup({ cache });
    await expect(service.getLives()).rejects.toMatchObject({ code: "upstream_unavailable" });
    expect(search).not.toHaveBeenCalled();
  });
});

describe("Twitch no agregador (spec 029)", () => {
  it("CA1: sem twitch em LIVES_PROVIDERS, nenhuma chamada à Twitch", async () => {
    const { service, search } = setup();
    const yt = youtube();
    const { providers } = selectProviders(["youtube"], { youtube: yt, twitch: createTwitchProvider(service) });
    await createLivesAggregator({ providers, log: () => {} }).getLives();
    expect(search).not.toHaveBeenCalled();
  });

  it("CA1: twitch listada sem credenciais fica de fora", () => {
    const yt = youtube();
    const r = selectProviders(["youtube", "twitch"], { youtube: yt, twitch: createTwitchProvider(null) });
    expect(r.providers.map((p) => p.platform)).toEqual(["youtube"]);
    expect(r.disabled).toEqual([{ platform: "twitch", reason: "not_configured" }]);
  });

  it("CA2 e CA6: com twitch ativa, lista intercalada e YouTube chamado uma vez como antes", async () => {
    const { service } = setup();
    const yt = youtube();
    const { providers } = selectProviders(["youtube", "twitch"], { youtube: yt, twitch: createTwitchProvider(service) });
    const r = await createLivesAggregator({ providers, log: () => {} }).getLives();
    expect(r.items.map((i) => i.id)).toEqual(["youtube:y0", "twitch:t0", "youtube:y1", "twitch:t1"]);
    expect(r.sources.map((s) => [s.platform, s.ok])).toEqual([["youtube", true], ["twitch", true]]);
    expect(r.nextPageToken).toBe("N");
    expect(yt.calls()).toBe(1);
  });

  it("CA4: Twitch com cache vencido aparece como stale em sources", async () => {
    let fail = false;
    const { service, clock } = setup({
      search: async () => {
        if (fail) throw new LivesError("upstream_unavailable");
        return [item("twitch", "t0", 0)];
      },
    });
    const yt = youtube();
    const agg = createLivesAggregator({ providers: [yt, createTwitchProvider(service)], log: () => {} });
    await agg.getLives();
    fail = true;
    clock.t += 200_000;
    const r = await agg.getLives();
    expect(r.sources[1]).toMatchObject({ platform: "twitch", ok: true, stale: true });
    expect(r.stale).toBe(true);
  });

  it("CA5: Twitch fora do ar sem cache → YouTube aparece e a Twitch fica ok: false", async () => {
    const { service } = setup({ search: async () => Promise.reject(new LivesError("upstream_config")) });
    const r = await createLivesAggregator({ providers: [youtube(), createTwitchProvider(service)], log: () => {} }).getLives();
    expect(r.items.map((i) => i.platform)).toEqual(["youtube", "youtube"]);
    expect(r.sources[1]).toMatchObject({ platform: "twitch", ok: false, errorCode: "upstream_config" });
  });

  it("D5: o provedor da Twitch tem timeout no agregador", () => {
    expect(createTwitchProvider(null).timeoutMs).toBe(TWITCH_TIMEOUT_MS);
    expect(TWITCH_TIMEOUT_MS).toBe(12_000);
  });
});

describe("limites do cache da Twitch (spec 029 D1, CA7)", () => {
  it("padrões 180 s e 600 s; valores fora dos limites são cortados (máx. 2 h no total)", () => {
    vi.stubEnv("TWITCH_CACHE_TTL_SECONDS", "");
    vi.stubEnv("TWITCH_STALE_TTL_SECONDS", "");
    expect(getServerEnv()).toMatchObject({ twitchCacheTtlSeconds: 180, twitchStaleTtlSeconds: 600 });
    vi.stubEnv("TWITCH_CACHE_TTL_SECONDS", "999999");
    vi.stubEnv("TWITCH_STALE_TTL_SECONDS", "999999");
    const env = getServerEnv();
    expect(env.twitchCacheTtlSeconds + env.twitchStaleTtlSeconds).toBeLessThanOrEqual(7_200);
    vi.unstubAllEnvs();
  });
});
