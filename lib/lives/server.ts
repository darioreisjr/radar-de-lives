import "server-only";
import { MemoryCache } from "@/lib/cache/memory-cache";
import { getServerEnv } from "@/lib/config/server-env";
import { FixedWindowRateLimit } from "@/lib/rate-limit/memory-rate-limit";
import { createYoutubeClient } from "@/lib/youtube/client";
import { buildCombinedQuery } from "@/lib/youtube/searches";
import { createLivesService, type LivesService, type PageData } from "@/lib/youtube/service";
import { createVideoStatusService, type VideoStatusService } from "@/lib/youtube/video-status";

/**
 * Singletons do processo. Em desenvolvimento, sobrevivem ao HMR via globalThis.
 * Em produção serverless, cada instância tem cache/contadores próprios (spec 001 §10).
 */
const g = globalThis as unknown as {
  __livesService?: { key: string | null; service: LivesService };
  __livesRateLimit?: FixedWindowRateLimit;
  __videoStatus?: { key: string | null; service: VideoStatusService };
};

function youtubeClient(env: ReturnType<typeof getServerEnv>) {
  return env.apiKey
    ? createYoutubeClient({ apiKey: env.apiKey, regionCode: env.region, relevanceLanguage: env.language })
    : null;
}

export function getLivesService(): LivesService {
  const env = getServerEnv();
  if (!g.__livesService || g.__livesService.key !== env.apiKey) {
    g.__livesService = {
      key: env.apiKey,
      service: createLivesService({
        client: youtubeClient(env),
        cache: new MemoryCache<PageData>(),
        config: {
          query: buildCombinedQuery(),
          ttlMs: env.cacheTtlSeconds * 1000,
          staleMs: env.staleTtlSeconds * 1000,
          minUpstreamIntervalMs: env.rateLimitSeconds * 1000,
          dailySearchBudget: env.dailySearchBudget,
        },
      }),
    };
  }
  return g.__livesService.service;
}

/** Revalidação de um vídeo ao abrir o player (spec 002 D5): cache de 60 s. */
export function getVideoStatusService(): VideoStatusService {
  const env = getServerEnv();
  if (!g.__videoStatus || g.__videoStatus.key !== env.apiKey) {
    g.__videoStatus = {
      key: env.apiKey,
      service: createVideoStatusService({
        client: youtubeClient(env),
        cache: new MemoryCache(500),
        ttlMs: 60_000,
        dailyBudget: env.dailyDetailsBudget,
      }),
    };
  }
  return g.__videoStatus.service;
}

/** 30 requisições por minuto por cliente (D6). */
export function getRouteRateLimit(): FixedWindowRateLimit {
  g.__livesRateLimit ??= new FixedWindowRateLimit(30, 60_000);
  return g.__livesRateLimit;
}
