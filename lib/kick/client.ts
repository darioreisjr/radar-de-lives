import "server-only";
import type { z } from "zod";
import { logEvent, type Logger } from "@/lib/telemetry";
import { LivesError } from "@/lib/youtube/errors";

const TOKEN_URL = "https://id.kick.com/oauth/token";
const API = "https://api.kick.com/public";

/** Renova o token 5 min antes de vencer (spec 046 D2). O token da Kick dura 60 dias. */
const REFRESH_MARGIN_MS = 5 * 60_000;
/** Espera padrão em 429 sem Retry-After (D4). */
const DEFAULT_RETRY_AFTER_S = 60;

export interface KickClientOptions {
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
}

type Params = Record<string, string | readonly string[]>;

/**
 * Cliente mínimo da API pública da Kick com token de app (spec 046).
 * O token fica só em memória (D1). NUNCA registrar URL, cabeçalhos, corpo, token ou secret (D5).
 */
export function createKickClient(opts: KickClientOptions) {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 8000;
  const retryDelayMs = opts.retryDelayMs ?? 500;
  const now = opts.now ?? Date.now;
  const log = opts.log ?? logEvent;

  let token: Token | null = null;
  let tokenTask: Promise<Token> | null = null;

  async function send(url: string | URL, init: RequestInit): Promise<Response | null> {
    try {
      return await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
    } catch {
      return null; // rede ou timeout
    }
  }

  async function requestToken(): Promise<Token> {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
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
          log("kick_error", { stage: "token", status: res.status, code: "invalid_response" });
          throw new LivesError("upstream_unavailable");
        }
        log("kick_token", { action: "issued" });
        return { value: data.access_token, expiresAt: now() + data.expires_in * 1000 };
      }
      const status = res?.status ?? 0;
      // Credencial inválida (D4).
      if (status === 400 || status === 401 || status === 403) {
        log("kick_error", { stage: "token", status, code: "upstream_config" });
        throw new LivesError("upstream_config");
      }
      if (attempt === 0) {
        await sleep(retryDelayMs);
        continue;
      }
      log("kick_error", { stage: "token", status, code: "upstream_unavailable" });
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

  async function getToken(): Promise<Token> {
    if (token && now() < token.expiresAt - REFRESH_MARGIN_MS) return token;
    return newToken();
  }

  function retryAfterSeconds(res: Response): number {
    const v = Number(res.headers.get("Retry-After"));
    return Number.isFinite(v) && v > 0 ? Math.ceil(v) : DEFAULT_RETRY_AFTER_S;
  }

  /**
   * GET autenticado na API pública, validado com o schema (D3).
   * `path` sem barra inicial (ex.: "v2/livestreams"). Arrays viram parâmetros repetidos.
   */
  async function api<T>(path: string, params: Params, schema: z.ZodType<T>): Promise<T> {
    const url = new URL(`${API}/${path}`);
    for (const [k, v] of Object.entries(params)) {
      for (const one of typeof v === "string" ? [v] : v) url.searchParams.append(k, one);
    }

    let retriedNetwork = false;
    let refreshed = false;
    for (;;) {
      const tk = await getToken();
      const res = await send(url, { headers: { Authorization: `Bearer ${tk.value}`, Accept: "application/json" } });

      if (!res || res.status >= 500) {
        if (!retriedNetwork) {
          retriedNetwork = true;
          await sleep(retryDelayMs);
          continue;
        }
        log("kick_error", { stage: "api", status: res?.status ?? 0, code: "upstream_unavailable" });
        throw new LivesError("upstream_unavailable");
      }

      if (res.status === 401) {
        if (token === tk) {
          token = null;
          log("kick_token", { action: "discarded" });
        }
        if (!refreshed) {
          refreshed = true;
          continue;
        }
        log("kick_error", { stage: "api", status: 401, code: "upstream_config" });
        throw new LivesError("upstream_config");
      }
      if (res.status === 429) {
        log("kick_error", { stage: "api", status: 429, code: "rate_limited" });
        throw new LivesError("rate_limited", retryAfterSeconds(res));
      }
      if (!res.ok) {
        log("kick_error", { stage: "api", status: res.status, code: "upstream_config" });
        throw new LivesError("upstream_config");
      }

      const parsed = schema.safeParse(await res.json().catch(() => null));
      if (!parsed.success) {
        log("kick_error", { stage: "api", status: res.status, code: "invalid_response" });
        throw new LivesError("upstream_unavailable");
      }
      return parsed.data;
    }
  }

  return { api };
}

export type KickClient = ReturnType<typeof createKickClient>;

/** Credenciais mínimas presentes (spec 046 D6). */
export function isKickConfigured(env: { kickClientId: string | null; kickClientSecret: string | null }): boolean {
  return !!env.kickClientId && !!env.kickClientSecret;
}

/** Cliente a partir do ambiente, ou null sem credenciais: nenhuma chamada de rede (CA1). */
export function createKickClientFromEnv(
  env: { kickClientId: string | null; kickClientSecret: string | null },
  extra: Omit<KickClientOptions, "clientId" | "clientSecret"> = {},
): KickClient | null {
  if (!isKickConfigured(env)) return null;
  return createKickClient({ clientId: env.kickClientId!, clientSecret: env.kickClientSecret!, ...extra });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
