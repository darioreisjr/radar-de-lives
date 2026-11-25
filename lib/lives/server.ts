import "server-only";
import { getServerEnv } from "@/lib/config/server-env";
import { createLivesAggregator, type LivesAggregator } from "@/lib/lives/aggregator";
import { createYoutubeProvider } from "@/lib/lives/providers/youtube";
import { createRateLimiter, type RateLimiter } from "@/lib/rate-limit/rate-limiter";
import { createStores, type Stores } from "@/lib/store";
import { createYoutubeClient } from "@/lib/youtube/client";
import { buildCombinedQuery } from "@/lib/youtube/searches";
import { createLivesService, type LivesService, type PageData } from "@/lib/youtube/service";
import { createVideoStatusService, type VideoStatusService, videoStatusFrom } from "@/lib/youtube/video-status";

type StatusData = ReturnType<typeof videoStatusFrom>;

/**
 * Singletons por instância. Com Upstash (spec 005), o ESTADO que protege a quota
 * (cache, orçamento, trava, rate limit) é compartilhado; estes objetos só guardam clientes.
 * Em desenvolvimento, sobrevivem ao HMR via globalThis.
 */
interface Runtime {
  signature: string;
  stores: Stores;
  lives: LivesService;
  /** Ponto único da rota /api/lives (spec 022). Por enquanto, só o YouTube. */
  aggregator: LivesAggregator;
  status: VideoStatusService;
  rateLimit: RateLimiter;
}

const g = globalThis as unknown as { __radarRuntime?: Runtime };

function build(): Runtime {
  const env = getServerEnv();
  const signature = [env.apiKey, env.upstashUrl, env.upstashToken].join("|");
  if (g.__radarRuntime?.signature === signature) return g.__radarRuntime;

  const stores = createStores(env);
  const client = env.apiKey
    ? createYoutubeClient({ apiKey: env.apiKey, regionCode: env.region, relevanceLanguage: env.language })
    : null;

  const lives = createLivesService({
    client,
    cache: stores.cache<PageData>("lives", 50),
    counter: stores.counter,
    lock: stores.lock,
    config: {
      query: buildCombinedQuery(),
      ttlMs: env.cacheTtlSeconds * 1000,
      staleMs: env.staleTtlSeconds * 1000,
      minUpstreamIntervalMs: env.rateLimitSeconds * 1000,
      dailySearchBudget: env.dailySearchBudget,
    },
  });

  g.__radarRuntime = {
    signature,
    stores,
    lives,
    aggregator: createLivesAggregator({ providers: [createYoutubeProvider(lives, client !== null)] }),
    // Revalidação ao abrir o player (002 D5): cache de 60 s.
    status: createVideoStatusService({
      client,
      cache: stores.cache<StatusData>("status", 500),
      counter: stores.counter,
      ttlMs: 60_000,
      dailyBudget: env.dailyDetailsBudget,
    }),
    // 30 requisições por minuto por cliente (001 D6).
    rateLimit: createRateLimiter({
      counter: stores.counter,
      limit: 30,
      windowMs: 60_000,
      secret: env.rateLimitSecret,
    }),
  };
  return g.__radarRuntime;
}

export const getLivesService = () => build().lives;
export const getLivesAggregator = () => build().aggregator;
export const getVideoStatusService = () => build().status;
export const getRouteRateLimit = () => build().rateLimit;
