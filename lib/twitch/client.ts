import "server-only";
import type { z } from "zod";
import { logEvent, type Logger } from "@/lib/telemetry";
import { LivesError } from "@/lib/youtube/errors";

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const VALIDATE_URL = "https://id.twitch.tv/oauth2/validate";
const HELIX = "https://api.twitch.tv/helix";

/** Renova o token 5 min antes de vencer; valida a cada 1 h (spec 027 D2). */
const REFRESH_MARGIN_MS = 5 * 60_000;
const VALIDATE_EVERY_MS = 60 * 60_000;

export interface TwitchClientOptions {
  clientId: string;
  clientSecret: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  retryDelayMs?: number;
  now?: () => number;
  log?: Logger;
}

interface Token {
  value: string;
  expiresAt: number;
  validatedAt: number;
}

export interface RateLimitInfo {
  remaining: number;
  /** Epoch em ms. */
  resetAt: number;
}

type Params = Record<string, string | readonly string[]>;

/**
 * Cliente mínimo da Twitch Helix com token de app (spec 027).
 * O token fica só em memória (D1). NUNCA registrar URL, cabeçalhos, corpo, token ou secret (D5).
 */
export function createTwitchClient(opts: TwitchClientOptions) {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 8000;
  const retryDelayMs = opts.retryDelayMs ?? 500;
  const now = opts.now ?? Date.now;
  const log = opts.log ?? logEvent;

  let token: Token | null = null;
  let tokenTask: Promise<Token> | null = null;
  let validateTask: Promise<void> | null = null;
  let lastRateLimit: RateLimitInfo | null = null;

  async function send(url: string | URL, init: RequestInit): Promise<Response | null> {
    try {
      return await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
    } catch {
      return null; // rede ou timeout
    }
  }

  async function requestToken(): Promise<Token> {
    const body = new URLSearchParams({
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      grant_type: "client_credentials",
    });
    for (let attempt = 0; ; attempt++) {
      const res = await send(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body,
      });
      if (res?.ok) {
        const data = (await res.json().catch(() => null)) as { access_token?: unknown; expires_in?: unknown } | null;
        if (typeof data?.access_token !== "string" || typeof data.expires_in !== "number") {
          log("twitch_error", { stage: "token", status: res.status, code: "invalid_response" });
          throw new LivesError("upstream_unavailable");
        }
        const t = now();
        log("twitch_token", { action: "issued" });
        return { value: data.access_token, expiresAt: t + data.expires_in * 1000, validatedAt: t };
      }
      const status = res?.status ?? 0;
      // Credencial inválida (D4).
      if (status === 400 || status === 401 || status === 403) {
        log("twitch_error", { stage: "token", status, code: "upstream_config" });
        throw new LivesError("upstream_config");
      }
      if (attempt === 0) {
        await sleep(retryDelayMs);
        continue;
      }
      log("twitch_error", { stage: "token", status, code: "upstream_unavailable" });
      throw new LivesError("upstream_unavailable");
    }
  }

  /** Single-flight: chamadas simultâneas sem token geram um único pedido (CA2). */
  function newToken(): Promise<Token> {
    tokenTask ??= requestToken()
      .then((t) => {
        token = t;
        return t;
      })
      .finally(() => {
        tokenTask = null;
      });
    return tokenTask;
  }

  /** Validação horária (D2): 401 descarta o token; outras falhas não bloqueiam. */
  function validate(current: Token): Promise<void> {
    validateTask ??= (async () => {
      const res = await send(VALIDATE_URL, { headers: { Authorization: `OAuth ${current.value}` } });
      if (res?.status === 401) {
        if (token === current) token = null;
        log("twitch_token", { action: "invalidated" });
        return;
      }
      if (res?.ok) current.validatedAt = now();
      else log("twitch_error", { stage: "validate", status: res?.status ?? 0, code: "ignored" });
    })().finally(() => {
      validateTask = null;
    });
    return validateTask;
  }

  async function getToken(): Promise<Token> {
    const t = now();
    if (token && t < token.expiresAt - REFRESH_MARGIN_MS) {
      if (t - token.validatedAt >= VALIDATE_EVERY_MS) await validate(token);
      if (token) return token;
    }
    return newToken();
  }

  function readRateLimit(res: Response) {
    const remaining = Number(res.headers.get("Ratelimit-Remaining"));
    const reset = Number(res.headers.get("Ratelimit-Reset"));
    if (Number.isFinite(remaining) && Number.isFinite(reset) && res.headers.has("Ratelimit-Reset")) {
      lastRateLimit = { remaining, resetAt: reset * 1000 };
    }
  }

  /**
   * GET autenticado na Helix, validado com o schema (D3).
   * Parâmetros em array viram repetidos (ex.: language=pt&language=en).
   */
  async function helix<T>(path: string, params: Params, schema: z.ZodType<T>): Promise<T> {
    const url = new URL(`${HELIX}/${path}`);
    for (const [k, v] of Object.entries(params)) {
      for (const one of typeof v === "string" ? [v] : v) url.searchParams.append(k, one);
    }

    let retriedNetwork = false;
    let refreshed = false;
    for (;;) {
      const tk = await getToken();
      const res = await send(url, {
        headers: { "Client-Id": opts.clientId, Authorization: `Bearer ${tk.value}`, Accept: "application/json" },
      });

      if (!res || res.status >= 500) {
        if (!retriedNetwork) {
          retriedNetwork = true;
          await sleep(retryDelayMs);
          continue;
        }
        log("twitch_error", { stage: "helix", status: res?.status ?? 0, code: "upstream_unavailable" });
        throw new LivesError("upstream_unavailable");
      }
      readRateLimit(res);

      if (res.status === 401) {
        if (token === tk) token = null;
        if (!refreshed) {
          refreshed = true;
          continue;
        }
        log("twitch_error", { stage: "helix", status: 401, code: "upstream_config" });
        throw new LivesError("upstream_config");
      }
      if (res.status === 429) {
        const reset = Number(res.headers.get("Ratelimit-Reset"));
        const wait = Number.isFinite(reset) && reset > 0 ? Math.max(1, Math.ceil((reset * 1000 - now()) / 1000)) : 60;
        log("twitch_error", { stage: "helix", status: 429, code: "rate_limited" });
        throw new LivesError("rate_limited", wait);
      }
      if (!res.ok) {
        log("twitch_error", { stage: "helix", status: res.status, code: "upstream_config" });
        throw new LivesError("upstream_config");
      }

      const parsed = schema.safeParse(await res.json().catch(() => null));
      if (!parsed.success) {
        log("twitch_error", { stage: "helix", status: res.status, code: "invalid_response" });
        throw new LivesError("upstream_unavailable");
      }
      return parsed.data;
    }
  }

  return {
    helix,
    /** Últimos cabeçalhos Ratelimit-* recebidos (usado pelo serviço na #41). */
    rateLimit: (): RateLimitInfo | null => lastRateLimit,
  };
}

export type TwitchClient = ReturnType<typeof createTwitchClient>;

/** Credenciais mínimas presentes (spec 027 D6). */
export function isTwitchConfigured(env: { twitchClientId: string | null; twitchClientSecret: string | null }): boolean {
  return !!env.twitchClientId && !!env.twitchClientSecret;
}

/** Cliente a partir do ambiente, ou null sem credenciais: nenhuma chamada de rede (CA1). */
export function createTwitchClientFromEnv(
  env: { twitchClientId: string | null; twitchClientSecret: string | null },
  extra: Omit<TwitchClientOptions, "clientId" | "clientSecret"> = {},
): TwitchClient | null {
  if (!isTwitchConfigured(env)) return null;
  return createTwitchClient({ clientId: env.twitchClientId!, clientSecret: env.twitchClientSecret!, ...extra });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
