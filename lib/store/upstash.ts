import type { CacheEntry, CacheStore, Counter, Lock } from "./types";
import { StoreError } from "./types";

/** Subconjunto do cliente Redis usado pelo app (facilita testes com um fake). */
export interface RedisLike {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts: { px: number; nx?: boolean }): Promise<"OK" | null | unknown>;
  incr(key: string): Promise<number>;
}

/** Prefixo versionado das chaves (spec 005 D9). */
export const KEY_PREFIX = "radar:v1:";

async function guard<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    // Não propaga a mensagem original: pode conter URL do banco.
    throw new StoreError(operation);
  }
}

export class UpstashCache<T> implements CacheStore<T> {
  constructor(
    private readonly redis: RedisLike,
    private readonly namespace: string,
  ) {}

  private key(k: string) {
    return `${KEY_PREFIX}cache:${this.namespace}:${k}`;
  }

  async get(key: string) {
    const v = await guard("cache.get", () => this.redis.get<CacheEntry<T>>(this.key(key)));
    return v ?? undefined;
  }

  async set(key: string, entry: CacheEntry<T>, maxAgeMs: number) {
    await guard("cache.set", () => this.redis.set(this.key(key), entry, { px: Math.max(1, Math.round(maxAgeMs)) }));
  }
}

/** Contador: SET NX PX cria a chave com TTL; INCR preserva o TTL (spec 005 D2). */
export class UpstashCounter implements Counter {
  constructor(private readonly redis: RedisLike) {}

  async incr(key: string, ttlMs: number) {
    const k = `${KEY_PREFIX}count:${key}`;
    return guard("counter.incr", async () => {
      await this.redis.set(k, 0, { nx: true, px: Math.max(1, Math.round(ttlMs)) });
      return this.redis.incr(k);
    });
  }
}

export class UpstashLock implements Lock {
  constructor(private readonly redis: RedisLike) {}

  async acquire(key: string, ttlMs: number) {
    const res = await guard("lock.acquire", () =>
      this.redis.set(`${KEY_PREFIX}lock:${key}`, 1, { nx: true, px: Math.max(1, Math.round(ttlMs)) }),
    );
    return res === "OK";
  }
}
