import { describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit/rate-limiter";
import { MemoryCounter } from "@/lib/store/memory";
import { StoreError } from "@/lib/store/types";
import { storeKeyPrefix, UpstashCache, UpstashCounter, UpstashLock, withKeyPrefix, type RedisLike } from "@/lib/store/upstash";
import { createYoutubeClient } from "@/lib/youtube/client";
import { createLivesService, type PageData } from "@/lib/youtube/service";

/** Redis falso: TTL em ms controlado por `now`, NX, INCR e serialização JSON como o SDK. */
class FakeRedis implements RedisLike {
  data = new Map<string, { v: string; exp: number }>();
  calls: { cmd: string; key: string; opts?: unknown }[] = [];
  constructor(public now: () => number) {}
  private live(key: string) {
    const e = this.data.get(key);
    if (e && e.exp <= this.now()) this.data.delete(key);
    return this.data.get(key);
  }
  async get<T>(key: string) {
    this.calls.push({ cmd: "get", key });
    const e = this.live(key);
    return e ? (JSON.parse(e.v) as T) : null;
  }
  async set(key: string, value: unknown, opts: { px: number; nx?: boolean }) {
    this.calls.push({ cmd: "set", key, opts });
    if (opts.nx && this.live(key)) return null;
    this.data.set(key, { v: JSON.stringify(value), exp: this.now() + opts.px });
    return "OK" as const;
  }
  async incr(key: string) {
    this.calls.push({ cmd: "incr", key });
    const e = this.live(key);
    const n = (e ? Number(JSON.parse(e.v)) : 0) + 1;
    this.data.set(key, { v: JSON.stringify(n), exp: e ? e.exp : Infinity }); // INCR preserva TTL
    return n;
  }
}

const failing: RedisLike = {
  get: async () => {
    throw new Error("https://db-ficticio.example.invalid network down");
  },
  set: async () => {
    throw new Error("down");
  },
  incr: async () => {
    throw new Error("down");
  },
};

describe("adaptadores Upstash (CA1, CA6)", () => {
  it("contador cria TTL no primeiro incremento e expira", async () => {
    let t = 0;
    const r = new FakeRedis(() => t);
    const c = new UpstashCounter(r);
    expect(await c.incr("k", 1000)).toBe(1);
    t = 600;
    expect(await c.incr("k", 1000)).toBe(2);
    t = 1001; // TTL conta do primeiro incremento, não do último
    expect(await c.incr("k", 1000)).toBe(1);
    expect(r.calls.find((x) => x.cmd === "set")?.opts).toEqual({ nx: true, px: 1000 });
    expect([...r.data.keys()][0]).toBe("radar:v1:count:k");
  });

  it("trava: só o primeiro obtém até expirar", async () => {
    let t = 0;
    const lock = new UpstashLock(new FakeRedis(() => t));
    expect(await lock.acquire("a", 30_000)).toBe(true);
    expect(await lock.acquire("a", 30_000)).toBe(false);
    t = 30_000;
    expect(await lock.acquire("a", 30_000)).toBe(true);
  });

  it("cache: ida e volta com TTL", async () => {
    let t = 0;
    const cache = new UpstashCache<{ n: number }>(new FakeRedis(() => t), "lives");
    await cache.set("page:first", { value: { n: 1 }, storedAt: 5 }, 1000);
    expect(await cache.get("page:first")).toEqual({ value: { n: 1 }, storedAt: 5 });
    t = 1000;
    expect(await cache.get("page:first")).toBeUndefined();
  });

  it("erro do provedor vira StoreError sem expor a mensagem original", async () => {
    const err = await new UpstashCache(failing, "x").get("k").catch((e) => e);
    expect(err).toBeInstanceOf(StoreError);
    expect(String(err.message)).not.toContain("example.invalid");
  });
});

describe("rate limit compartilhado (CA4)", () => {
  it("conta entre instâncias e não grava o IP", async () => {
    const r = new FakeRedis(() => 0);
    const counter = new UpstashCounter(r);
    const a = createRateLimiter({ counter, limit: 2, windowMs: 60_000, secret: "s", now: () => 0 });
    const b = createRateLimiter({ counter, limit: 2, windowMs: 60_000, secret: "s", now: () => 0 });
    expect((await a.check("203.0.113.7")).ok).toBe(true);
    expect((await b.check("203.0.113.7")).ok).toBe(true);
    expect(await a.check("203.0.113.7")).toEqual({ ok: false, retryAfterSeconds: 60 });
    expect((await b.check("198.51.100.1")).ok).toBe(true);
    expect([...r.data.keys()].join(" ")).not.toContain("203.0.113.7");
  });

  it("falha do store permite a requisição (falha aberta)", async () => {
    const rl = createRateLimiter({ counter: new UpstashCounter(failing), limit: 1, windowMs: 1000, secret: "s" });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await rl.check("x")).toEqual({ ok: true });
  });

  it("memória continua funcionando igual", async () => {
    const rl = createRateLimiter({ counter: new MemoryCounter(() => 0), limit: 1, windowMs: 1000, secret: "s", now: () => 0 });
    expect((await rl.check("x")).ok).toBe(true);
    expect((await rl.check("x")).ok).toBe(false);
  });
});

/* ---------- Serviço de lives com duas instâncias sobre o mesmo Redis ---------- */

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function youtubeFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    await new Promise((r) => setTimeout(r, 5));
    return String(input).includes("/search?")
      ? json(200, { nextPageToken: "NEXT_1", items: [{ id: { videoId: "aaaaaaaaaaa" }, snippet: { liveBroadcastContent: "live" } }] })
      : json(200, { items: [{ id: "aaaaaaaaaaa", snippet: { liveBroadcastContent: "live" } }] });
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

function instance(redis: RedisLike, fetchImpl: typeof fetch, budget = 90) {
  return createLivesService({
    client: createYoutubeClient({ apiKey: "K", regionCode: "BR", relevanceLanguage: "pt", fetchImpl, retryDelayMs: 0 }),
    cache: new UpstashCache<PageData>(redis, "lives"),
    counter: new UpstashCounter(redis),
    lock: new UpstashLock(redis),
    sleep: (ms) => new Promise((r) => setTimeout(r, Math.min(ms, 5))),
    config: { query: "q", ttlMs: 900_000, staleMs: 600_000, minUpstreamIntervalMs: 30_000, dailySearchBudget: budget },
    log: () => {},
  });
}

const searchCalls = (f: ReturnType<typeof vi.fn>) => f.mock.calls.filter((c) => String(c[0]).includes("/search?")).length;

describe("serviço com estado compartilhado", () => {
  it("duas instâncias, requisições simultâneas: uma única search.list (CA2)", async () => {
    const redis = new FakeRedis(Date.now);
    const f = youtubeFetch();
    const a = instance(redis, f);
    const b = instance(redis, f);
    const results = await Promise.all([a.getLives(), b.getLives(), a.getLives(), b.getLives()]);
    expect(searchCalls(f)).toBe(1);
    expect(results.every((r) => r.items.length === 1 && !r.stale)).toBe(true);
  });

  it("orçamento diário é único entre instâncias (CA3)", async () => {
    const redis = new FakeRedis(Date.now);
    const f = youtubeFetch();
    await instance(redis, f, 1).getLives();
    await expect(instance(redis, f, 1).getLives("NEXT_1")).rejects.toMatchObject({ code: "quota_exceeded" });
    expect(searchCalls(f)).toBe(1);
  });

  it("store fora do ar: falha fechada, sem chamar o YouTube (CA5)", async () => {
    const f = youtubeFetch();
    await expect(instance(failing, f).getLives()).rejects.toMatchObject({ code: "upstream_unavailable" });
    expect(f).not.toHaveBeenCalled();
  });
});

describe("chaves separadas por ambiente (spec 036)", () => {
  it("Production e local sem VERCEL_ENV usam as chaves de sempre; Preview e Development ganham prefixo", () => {
    expect(storeKeyPrefix("production")).toBe("");
    expect(storeKeyPrefix(undefined)).toBe("");
    expect(storeKeyPrefix("")).toBe("");
    expect(storeKeyPrefix("preview")).toBe("preview:");
    expect(storeKeyPrefix("development")).toBe("development:");
    expect(storeKeyPrefix("x y!")).toBe("preview:");
  });

  it("cache, contador e trava do Preview não tocam as chaves da produção", async () => {
    const redis = new FakeRedis(() => 0);
    const prod = new UpstashCache<string>(redis, "lives:twitch");
    const preview = new UpstashCache<string>(withKeyPrefix(redis, "preview:"), "lives:twitch");
    await prod.set("k", { value: "produção", storedAt: 0 }, 60_000);
    await preview.set("k", { value: "preview", storedAt: 0 }, 60_000);
    expect((await prod.get("k"))?.value).toBe("produção");
    expect((await preview.get("k"))?.value).toBe("preview");

    const prodKeys = redis.calls.filter((c) => !c.key.startsWith("preview:")).map((c) => c.key);
    const previewKeys = redis.calls.filter((c) => c.key.startsWith("preview:")).map((c) => c.key.slice("preview:".length));
    expect(previewKeys).toEqual(prodKeys);

    // Contador e trava: o Preview conta e trava à parte.
    expect(await new UpstashCounter(withKeyPrefix(redis, "preview:")).incr("c", 1000)).toBe(1);
    expect(await new UpstashCounter(redis).incr("c", 1000)).toBe(1);
    expect(await new UpstashLock(withKeyPrefix(redis, "preview:")).acquire("l", 1000)).toBe(true);
    expect(await new UpstashLock(redis).acquire("l", 1000)).toBe(true);
  });

  it("sem prefixo, o cliente é o mesmo (produção intacta)", () => {
    const redis = new FakeRedis(() => 0);
    expect(withKeyPrefix(redis, "")).toBe(redis);
  });
});
