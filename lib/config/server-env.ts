import "server-only";

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
  return {
    apiKey,
    cacheTtlSeconds: int("LIVE_CACHE_TTL_SECONDS", 900, 30, 86_400),
    staleTtlSeconds: int("LIVE_STALE_TTL_SECONDS", 600, 0, 86_400),
    rateLimitSeconds: int("LIVE_RATE_LIMIT_SECONDS", 30, 5, 3_600),
    dailySearchBudget: int("YOUTUBE_SEARCH_DAILY_BUDGET", 90, 1, 100_000),
    dailyDetailsBudget: int("YOUTUBE_DETAILS_DAILY_BUDGET", 2000, 1, 100_000),
    region: code("YOUTUBE_DEFAULT_REGION", "BR", /^[A-Z]{2}$/),
    language: code("YOUTUBE_DEFAULT_LANGUAGE", "pt", /^[a-z]{2}(-[A-Za-z]{2,4})?$/),
  };
}
