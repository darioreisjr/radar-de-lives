import type { CacheEntry, CacheStore, Counter, Lock } from "./types";
import { StoreError } from "./types";

/** Subconjunto do cliente Redis usado pelo app (facilita testes com um fake). */
export interface RedisLike {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts: { px: number; nx?: boolean }): Promise<"OK" | null | unknown>;
  incr(key: string): Promise<number>;
}

/**
 * Prefixo das chaves por ambiente (spec 036): Production usa as chaves de sempre;
 * Preview e Development ganham um prefixo próprio para não ler nem gravar
 * o cache, os contadores e as travas da produção no mesmo Redis.
 */
export function storeKeyPrefix(vercelEnv: string | undefined): string {
  const env = vercelEnv?.trim().toLowerCase();
  if (!env || env === "production") return "";
  return /^[a-z]{1,20}$/.test(env) ? `${env}:` : "preview:";
}

/** Aplica o prefixo a toda chave lida ou gravada. Sem prefixo, devolve o mesmo cliente. */
export function withKeyPrefix(redis: RedisLike, prefix: string): RedisLike {
  if (!prefix) return redis;
  return {
    get: (key) => redis.get(prefix + key),
    set: (key, value, opts) => redis.set(prefix + key, value, opts),
    incr: (key) => redis.incr(prefix + key),
  };
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
