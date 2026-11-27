import type { ProviderResult } from "@/lib/lives/providers/types";
import type { LiveItem } from "@/lib/lives/types";
import type { CacheEntry, CacheStore, Lock } from "@/lib/store/types";
import { logEvent, type Logger } from "@/lib/telemetry";
import { LivesError } from "@/lib/youtube/errors";

export interface KickPage {
  items: LiveItem[];
}

export interface KickServiceConfig {
  ttlMs: number;
  staleMs: number;
  /** Duração da trava entre instâncias (D4). */
  minUpstreamIntervalMs: number;
}

export interface KickServiceDeps {
  /** Busca na Kick (searchKickLives já com o cliente e a categoria). */
  search: () => Promise<LiveItem[]>;
  cache: CacheStore<KickPage>;
  lock: Lock;
  config: KickServiceConfig;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  log?: Logger;
}

const KEY = "page:first";
const WAIT_STEPS = 6;
const WAIT_STEP_MS = 500;

/**
 * Serviço da Kick (spec 048): cache compartilhado, cache vencido em falha, trava entre
 * instâncias e single-flight. Mesmo desenho do serviço da Twitch (spec 029), sem orçamento diário (D1).
 */
export function createKickLivesService(deps: KickServiceDeps) {
  const now = deps.now ?? Date.now;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const log = deps.log ?? logEvent;
  const { config } = deps;
  let inflight: Promise<ProviderResult> | null = null;

  /** Falha do store fecha sem chamar a Kick (D3). */
  async function store<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch {
      log("store_error", { operation, platform: "kick" });
      throw new LivesError("upstream_unavailable");
    }
  }

  const toResult = (e: CacheEntry<KickPage>, cached: boolean, stale: boolean): ProviderResult => ({
    items: e.value.items,
    updatedAt: new Date(e.storedAt).toISOString(),
    cached,
    stale,
    nextPageToken: null,
  });

  async function waitForNewer(since: number): Promise<CacheEntry<KickPage> | undefined> {
    for (let i = 0; i < WAIT_STEPS; i++) {
      await sleep(WAIT_STEP_MS);
      const e = await deps.cache.get(KEY).catch(() => undefined);
      if (e && e.storedAt > since) return e;
    }
    return undefined;
  }

  async function getLives(): Promise<ProviderResult> {
    const entry = await store("cache.get", () => deps.cache.get(KEY));
    const age = entry ? now() - entry.storedAt : Infinity;
    if (entry && age < config.ttlMs) return toResult(entry, true, false);

    // Single-flight nesta instância (CA3).
    if (inflight) return inflight;

    inflight = (async (): Promise<ProviderResult> => {
      try {
        const acquired = await store("lock.acquire", () => deps.lock.acquire(`lives:kick:${KEY}`, config.minUpstreamIntervalMs));
        if (!acquired) {
          // Outra instância está buscando: espera o cache novo dela.
          const newer = await waitForNewer(entry?.storedAt ?? 0);
          if (newer) return toResult(newer, true, false);
          if (entry) return toResult(entry, true, true);
          throw new LivesError("upstream_unavailable");
        }
        const items = await deps.search();
        const storedAt = now();
        try {
          await deps.cache.set(KEY, { value: { items }, storedAt }, config.ttlMs + config.staleMs);
        } catch {
          log("store_error", { operation: "cache.set", platform: "kick" });
        }
        log("kick_call", { items: items.length });
        return { items, updatedAt: new Date(storedAt).toISOString(), cached: false, stale: false, nextPageToken: null };
      } catch (e) {
        const err = e instanceof LivesError ? e : new LivesError("upstream_unavailable");
        // Cache vencido em falha (CA4).
        if (entry) {
          log("stale_served", { platform: "kick", code: err.code, ageSeconds: Math.round(age / 1000) });
          return toResult(entry, true, true);
        }
        throw err;
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  }

  return { getLives };
}

export type KickLivesService = ReturnType<typeof createKickLivesService>;
