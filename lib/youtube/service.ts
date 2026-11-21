import type { CacheStore } from "@/lib/cache/types";
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
  /** Intervalo mínimo entre buscas no YouTube (D5). */
  minUpstreamIntervalMs: number;
  /** Máximo de search.list por dia (D2). */
  dailySearchBudget: number;
}

export interface LivesServiceDeps {
  client: YoutubeClient | null;
  cache: CacheStore<PageData>;
  config: LivesServiceConfig;
  now?: () => number;
  log?: Logger;
}

export function createLivesService(deps: LivesServiceDeps) {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? logEvent;
  const { config } = deps;
  const inflight = new Map<string, Promise<LivesResult>>();
  const budget = createDailyBudget(config.dailySearchBudget, now);
  const lastUpstreamAt = new Map<string, number>();

  async function fetchPage(pageToken?: string): Promise<PageData> {
    const client = deps.client;
    if (!client) throw new LivesError("missing_api_key");
    const search = await client.searchLive(config.query, pageToken);
    log("youtube_call", {
      method: "search.list",
      page: pageToken ? "next" : "first",
      budgetUsed: budget.used(),
      budgetLimit: config.dailySearchBudget,
    });
    const ids = searchVideoIds(search.items);

    let details: YtVideoItem[] | null = [];
    if (ids.length > 0) {
      try {
        details = (await client.videoDetails(ids)).items ?? [];
        log("youtube_call", { method: "videos.list", ids: ids.length });
      } catch (e) {
        // Sem detalhes: mantém dados da busca, sem inventar audiência (D10).
        log("youtube_error", { method: "videos.list", code: e instanceof LivesError ? e.code : "unknown" });
        details = null;
      }
    }
    return {
      items: normalizeLives(search.items, details),
      nextPageToken: search.nextPageToken ?? null,
    };
  }

  async function getLives(pageToken?: string): Promise<LivesResult> {
    if (!deps.client) throw new LivesError("missing_api_key");
    const key = pageToken ? `page:${pageToken}` : "page:first";
    const entry = await deps.cache.get(key);
    const t = now();
    const age = entry ? t - entry.storedAt : Infinity;

    const fromEntry = (stale: boolean): LivesResult => ({
      ...entry!.value,
      updatedAt: new Date(entry!.storedAt).toISOString(),
      cached: true,
      stale,
    });

    if (entry && age < config.ttlMs) return fromEntry(false);
    if (entry && t - (lastUpstreamAt.get(key) ?? 0) < config.minUpstreamIntervalMs) return fromEntry(false);

    const running = inflight.get(key);
    if (running) return running;

    const task = (async (): Promise<LivesResult> => {
      try {
        if (!budget.consume()) {
          log("budget_exhausted", { method: "search.list", budgetLimit: config.dailySearchBudget });
          throw new LivesError("quota_exceeded");
        }
        lastUpstreamAt.set(key, now());
        const value = await fetchPage(pageToken);
        const storedAt = now();
        await deps.cache.set(key, { value, storedAt }, config.ttlMs + config.staleMs);
        return { ...value, updatedAt: new Date(storedAt).toISOString(), cached: false, stale: false };
      } catch (e) {
        const err = e instanceof LivesError ? e : new LivesError("upstream_unavailable");
        if (err.code !== "missing_api_key") log("youtube_error", { method: "search.list", code: err.code });
        if (entry && age < config.ttlMs + config.staleMs) {
          log("stale_served", { code: err.code, ageSeconds: Math.round(age / 1000) });
          return fromEntry(true);
        }
        throw err;
      } finally {
        inflight.delete(key);
      }
    })();
    inflight.set(key, task);
    return task;
  }

  return { getLives, budgetUsed: budget.used };
}

export type LivesService = ReturnType<typeof createLivesService>;
