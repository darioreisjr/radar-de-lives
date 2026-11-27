import "server-only";
import { randomBytes } from "node:crypto";

/** Chave aleatória por processo: usada só no modo memória, onde não precisa ser compartilhada. */
const PROCESS_SECRET = randomBytes(32).toString("base64url");

function int(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  const n = raw === undefined || raw === "" ? fallback : Number.parseInt(raw, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function code(name: string, fallback: string, pattern: RegExp): string {
  const raw = process.env[name]?.trim();
  return raw && pattern.test(raw) ? raw : fallback;
}

/** Configuração somente do servidor. A chave nunca deve sair deste módulo para o cliente. */
export function getServerEnv() {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim() || null;
  // Spec 005: aceita os nomes do Upstash e os antigos do Vercel KV (os mesmos lidos pelo SDK).
  const upstashUrl = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)?.trim() || null;
  const upstashToken = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)?.trim() || null;
  return {
    apiKey,
    upstashUrl,
    upstashToken,
    /** Chave do HMAC que pseudonimiza o IP no rate limit (spec 005 D5). */
    rateLimitSecret: process.env.RATE_LIMIT_SECRET?.trim() || upstashToken || PROCESS_SECRET,
    /** Texto bruto de LIVES_PROVIDERS; interpretado por parseProviderList (spec 023). */
    livesProviders: process.env.LIVES_PROVIDERS ?? null,
    /** Twitch (spec 027): segredo só no servidor. Sem as duas, a Twitch fica "não configurada". */
    twitchClientId: process.env.TWITCH_CLIENT_ID?.trim() || null,
    twitchClientSecret: process.env.TWITCH_CLIENT_SECRET?.trim() || null,
    /** Categoria "Grand Theft Auto VI" na Twitch (spec 019, consultada em 2026-11-25). */
    twitchGameId: code("TWITCH_GAME_ID", "1867279146", /^\d{1,20}$/),
    /**
     * Cache da Twitch (spec 029 D1). No máximo 1 h + 1 h: bem abaixo das 24 h
     * permitidas pelo Developer Agreement da Twitch (Schedule 1 §C).
     */
    twitchCacheTtlSeconds: int("TWITCH_CACHE_TTL_SECONDS", 180, 30, 3_600),
    twitchStaleTtlSeconds: int("TWITCH_STALE_TTL_SECONDS", 600, 0, 3_600),
    /** Páginas de 100 lives buscadas na Twitch (spec 035): padrão 1, de 1 a 3. */
    twitchMaxPages: int("TWITCH_MAX_PAGES", 1, 1, 3),
    /** Kick (spec 046): segredo só no servidor. Sem as duas, a Kick fica "não configurada". */
    kickClientId: process.env.KICK_CLIENT_ID?.trim() || null,
    kickClientSecret: process.env.KICK_CLIENT_SECRET?.trim() || null,
    /** Categoria "Grand Theft Auto VI (GTA)" na Kick (spec 020, consultada em 2026-11-27). */
    kickCategoryId: code("KICK_CATEGORY_ID", "13155", /^\d{1,20}$/),
    cacheTtlSeconds: int("LIVE_CACHE_TTL_SECONDS", 900, 30, 86_400),
    staleTtlSeconds: int("LIVE_STALE_TTL_SECONDS", 600, 0, 86_400),
    rateLimitSeconds: int("LIVE_RATE_LIMIT_SECONDS", 30, 5, 3_600),
    dailySearchBudget: int("YOUTUBE_SEARCH_DAILY_BUDGET", 90, 1, 100_000),
    dailyDetailsBudget: int("YOUTUBE_DETAILS_DAILY_BUDGET", 2000, 1, 100_000),
    region: code("YOUTUBE_DEFAULT_REGION", "BR", /^[A-Z]{2}$/),
    language: code("YOUTUBE_DEFAULT_LANGUAGE", "pt", /^[a-z]{2}(-[A-Za-z]{2,4})?$/),
  };
}
