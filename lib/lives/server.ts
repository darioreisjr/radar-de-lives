import "server-only";
import { getServerEnv } from "@/lib/config/server-env";
import { createLivesAggregator, type LivesAggregator } from "@/lib/lives/aggregator";
import { parseProviderList, selectProviders } from "@/lib/lives/providers/select";
import type { LivesProvider } from "@/lib/lives/providers/types";
import { createTwitchProvider } from "@/lib/lives/providers/twitch";
import { createYoutubeProvider } from "@/lib/lives/providers/youtube";
import { createStatusHandler, type StatusHandler } from "@/lib/lives/status-handler";
import type { Platform } from "@/lib/lives/types";
import { logEvent } from "@/lib/telemetry";
import { createRateLimiter, type RateLimiter } from "@/lib/rate-limit/rate-limiter";
import { createStores, type Stores } from "@/lib/store";
import { createTwitchClientFromEnv } from "@/lib/twitch/client";
import { searchTwitchLives } from "@/lib/twitch/search";
import { createTwitchLivesService, type TwitchPage } from "@/lib/twitch/service";
import { createTwitchStatusService, type TwitchStatusData } from "@/lib/twitch/status";
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
  /** Ponto único da rota /api/lives (spec 022). */
  aggregator: LivesAggregator;
  /** Provedores ativos, selecionados por LIVES_PROVIDERS (spec 023). */
  providers: LivesProvider[];
  status: VideoStatusService;
  /** Handler das rotas de status (spec 024). */
  statusHandler: StatusHandler;
  rateLimit: RateLimiter;
}

const g = globalThis as unknown as { __radarRuntime?: Runtime };

function build(): Runtime {
  const env = getServerEnv();
  const signature = [
    env.apiKey,
    env.upstashUrl,
    env.upstashToken,
    env.livesProviders,
    env.twitchClientId,
    env.twitchClientSecret,
    env.twitchGameId,
    env.twitchCacheTtlSeconds,
    env.twitchStaleTtlSeconds,
    env.twitchMaxPages,
  ].join("|");
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

  // Revalidação ao abrir o player (002 D5): cache de 60 s.
  const status = createVideoStatusService({
    client,
    cache: stores.cache<StatusData>("status", 500),
    counter: stores.counter,
    ttlMs: 60_000,
    dailyBudget: env.dailyDetailsBudget,
  });

  // 30 requisições por minuto por cliente (001 D6).
  const rateLimit = createRateLimiter({
    counter: stores.counter,
    limit: 30,
    windowMs: 60_000,
    secret: env.rateLimitSecret,
  });

  // Twitch (spec 029): só existe com credenciais; só fica ativa com `twitch` em LIVES_PROVIDERS.
  const twitchClient = createTwitchClientFromEnv(env);
  const twitch = twitchClient
    ? createTwitchLivesService({
        search: () => searchTwitchLives(twitchClient, { gameId: env.twitchGameId, maxPages: env.twitchMaxPages }),
        cache: stores.cache<TwitchPage>("lives:twitch", 5),
        lock: stores.lock,
        config: {
          ttlMs: env.twitchCacheTtlSeconds * 1000,
          staleMs: env.twitchStaleTtlSeconds * 1000,
          minUpstreamIntervalMs: env.rateLimitSeconds * 1000,
        },
      })
    : null;
  // Revalidação ao abrir o player (spec 030): cache de 60 s, como no YouTube.
  const twitchStatus = twitchClient
    ? createTwitchStatusService({
        client: twitchClient,
        cache: stores.cache<TwitchStatusData>("status:twitch", 500),
        ttlMs: 60_000,
      })
    : null;

  const providers = activeProviders(env.livesProviders, {
    youtube: createYoutubeProvider(lives, client !== null, status),
    twitch: createTwitchProvider(twitch, twitchStatus),
  });

  g.__radarRuntime = {
    signature,
    stores,
    lives,
    aggregator: createLivesAggregator({ providers }),
    providers,
    status,
    statusHandler: createStatusHandler({ rateLimit: () => rateLimit, providers: () => providers }),
    rateLimit,
  };
  return g.__radarRuntime;
}

export const getLivesService = () => build().lives;
export const getLivesAggregator = () => build().aggregator;
export const getVideoStatusService = () => build().status;
export const getRouteRateLimit = () => build().rateLimit;
export const getStatusHandler = () => build().statusHandler;

/**
 * Provedores ativos conforme LIVES_PROVIDERS (spec 023). Roda uma vez por instância
 * (por assinatura do runtime), então os logs também saem uma vez.
 */
function activeProviders(raw: string | null, candidates: Partial<Record<Platform, LivesProvider>>) {
  const { platforms, ignored } = parseProviderList(raw);
  if (ignored > 0) logEvent("config_warning", { variable: "LIVES_PROVIDERS", ignored });
  // Twitch e Kick entram nos candidatos nas Fases 2 e 3.
  const { providers, disabled } = selectProviders(platforms, candidates);
  for (const d of disabled) logEvent("provider_disabled", { platform: d.platform, reason: d.reason });
  return providers;
}
