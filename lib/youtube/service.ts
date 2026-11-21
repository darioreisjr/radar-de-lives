import type { CacheEntry, CacheStore, Counter, Lock } from "@/lib/store/types";
import { logEvent, type Logger } from "@/lib/telemetry";
import { createDailyBudget } from "./daily-budget";
import { LivesError } from "./errors";
import { normalizeLives, searchVideoIds } from "./normalize";
import type { YoutubeClient } from "./client";
import type { LiveItem, YtVideoItem } from "./types";

export interface PageData {
  items: LiveItem[];
  nextPageToken: string | null;
}

export interface LivesResult extends PageData {
  updatedAt: string;
  cached: boolean;
  stale: boolean;
}

export interface LivesServiceConfig {
  query: string;
  ttlMs: number;
  staleMs: number;
  /** Intervalo mínimo entre buscas no YouTube: duração da trava (spec 005 D3). */
  minUpstreamIntervalMs: number;
  /** Máximo de search.list por dia, compartilhado entre instâncias (spec 005 D4). */
  dailySearchBudget: number;
}

export interface LivesServiceDeps {
  client: YoutubeClient | null;
  cache: CacheStore<PageData>;
  counter: Counter;
  lock: Lock;
  config: LivesServiceConfig;
  now?: () => number;
  /** Espera entre leituras do cache quando outra instância detém a trava. */
  sleep?: (ms: number) => Promise<void>;
  log?: Logger;
}

const WAIT_STEPS = 6;
const WAIT_STEP_MS = 500;

export function createLivesService(deps: LivesServiceDeps) {
  const now = deps.now ?? Date.now;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const log = deps.log ?? logEvent;
  const { config } = deps;
  const inflight = new Map<string, Promise<LivesResult>>();
  const budget = createDailyBudget({ limit: config.dailySearchBudget, counter: deps.counter, method: "search.list", now });

  /** Falhas do store fecham sem chamar o YouTube (spec 005 D6). */
  async function store<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch {
      log("store_error", { operation });
      throw new LivesError("upstream_unavailable");
    }
  }

  async function fetchPage(pageToken: string | undefined, budgetUsed: number): Promise<PageData> {
    const client = deps.client;
    if (!client) throw new LivesError("missing_api_key");
    const search = await client.searchLive(config.query, pageToken);
    log("youtube_call", {
      method: "search.list",
      page: pageToken ? "next" : "first",
      budgetUsed,
      budgetLimit: config.dailySearchBudget,
    });
    const ids = searchVideoIds(search.items);

    let details: YtVideoItem[] | null = [];
    if (ids.length > 0) {
      try {
        details = (await client.videoDetails(ids)).items ?? [];
        log("youtube_call", { method: "videos.list", ids: ids.length });
      } catch (e) {
        // Sem detalhes: mantém dados da busca, sem inventar audiência (001 D10).
        log("youtube_error", { method: "videos.list", code: e instanceof LivesError ? e.code : "unknown" });
        details = null;
      }
    }
    return {
      items: normalizeLives(search.items, details),
      nextPageToken: search.nextPageToken ?? null,
    };
  }

  /** Outra instância detém a trava: espera um cache mais novo por até ~3 s. */
  async function waitForNewer(key: string, since: number): Promise<CacheEntry<PageData> | undefined> {
    for (let i = 0; i < WAIT_STEPS; i++) {
      await sleep(WAIT_STEP_MS);
      const e = await deps.cache.get(key).catch(() => undefined);
      if (e && e.storedAt > since) return e;
    }
    return undefined;
  }

  const toResult = (e: CacheEntry<PageData>, cached: boolean, stale: boolean): LivesResult => ({
    ...e.value,
    updatedAt: new Date(e.storedAt).toISOString(),
    cached,
    stale,
  });

  async function getLives(pageToken?: string): Promise<LivesResult> {
    if (!deps.client) throw new LivesError("missing_api_key");
    const key = pageToken ? `page:${pageToken}` : "page:first";
    const entry = await store("cache.get", () => deps.cache.get(key));
    const age = entry ? now() - entry.storedAt : Infinity;

    if (entry && age < config.ttlMs) return toResult(entry, true, false);

    const running = inflight.get(key);
    if (running) return running;

    const task = (async (): Promise<LivesResult> => {
      let calledYoutube = false;
      try {
        const acquired = await store("lock.acquire", () => deps.lock.acquire(`lives:${key}`, config.minUpstreamIntervalMs));
        if (!acquired) {
          const newer = await waitForNewer(key, entry?.storedAt ?? 0);
          if (newer) return toResult(newer, true, false);
          if (entry) return toResult(entry, true, true);
          throw new LivesError("upstream_unavailable");
        }

        const b = await store("budget.consume", () => budget.consume());
        if (!b.ok) {
          log("budget_exhausted", { method: "search.list", budgetLimit: config.dailySearchBudget });
          throw new LivesError("quota_exceeded");
        }
        calledYoutube = true;
        const value = await fetchPage(pageToken, b.used);
        const storedAt = now();
        try {
          await deps.cache.set(key, { value, storedAt }, config.ttlMs + config.staleMs);
        } catch {
          log("store_error", { operation: "cache.set" });
        }
        return { ...value, updatedAt: new Date(storedAt).toISOString(), cached: false, stale: false };
      } catch (e) {
        const err = e instanceof LivesError ? e : new LivesError("upstream_unavailable");
        if (calledYoutube) log("youtube_error", { method: "search.list", code: err.code });
        if (entry) {
          log("stale_served", { code: err.code, ageSeconds: Math.round(age / 1000) });
          return toResult(entry, true, true);
        }
        throw err;
      } finally {
        inflight.delete(key);
      }
    })();
    inflight.set(key, task);
    return task;
  }

  return { getLives };
}

export type LivesService = ReturnType<typeof createLivesService>;
