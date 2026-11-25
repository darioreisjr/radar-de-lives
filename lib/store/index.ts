import "server-only";
import { Redis } from "@upstash/redis";
import { MemoryCache } from "@/lib/cache/memory-cache";
import { logEvent } from "@/lib/telemetry";
import { MemoryCounter, MemoryLock } from "./memory";
import type { CacheStore, Counter, Lock } from "./types";
import { storeKeyPrefix, UpstashCache, UpstashCounter, UpstashLock, withKeyPrefix, type RedisLike } from "./upstash";

export interface Stores {
  kind: "upstash" | "memory";
  cache<T>(namespace: string, maxEntries: number): CacheStore<T>;
  counter: Counter;
  lock: Lock;
}

/** Adapta o cliente oficial à interface mínima usada pelo app. */
function fromUpstash(redis: Redis): RedisLike {
  return {
    get: <T>(key: string) => redis.get<T>(key),
    set: (key, value, { px, nx }) => (nx ? redis.set(key, value, { px, nx: true }) : redis.set(key, value, { px })),
    incr: (key) => redis.incr(key),
  };
}

/**
 * Escolhe o armazenamento (spec 005 D1): Upstash se URL e token existirem; senão memória.
 */
export function createStores(env: { upstashUrl: string | null; upstashToken: string | null }): Stores {
  if (env.upstashUrl && env.upstashToken) {
    // Spec 036: Preview e Development não compartilham chaves com a produção.
    const prefix = storeKeyPrefix(process.env.VERCEL_ENV);
    const redis = withKeyPrefix(
      fromUpstash(
        new Redis({
          url: env.upstashUrl,
          token: env.upstashToken,
          // D7: falhar rápido para não segurar a requisição; sem telemetria do SDK.
          retry: { retries: 2, backoff: (n) => 50 * 2 ** n },
          signal: () => AbortSignal.timeout(2000),
          enableTelemetry: false,
        }),
      ),
      prefix,
    );
    return {
      kind: "upstash",
      cache: <T>(namespace: string) => new UpstashCache<T>(redis, namespace),
      counter: new UpstashCounter(redis),
      lock: new UpstashLock(redis),
    };
  }

  // D8: na Vercel sem Upstash, cada instância teria quota e cache próprios.
  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    logEvent("store_memory_in_production", { reason: "upstash_not_configured" });
  }
  return {
    kind: "memory",
    cache: <T>(_namespace: string, maxEntries: number) => new MemoryCache<T>(maxEntries),
    counter: new MemoryCounter(),
    lock: new MemoryLock(),
  };
}
