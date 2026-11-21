import { createHmac } from "node:crypto";
import { logEvent } from "@/lib/telemetry";
import type { Counter } from "@/lib/store/types";

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/**
 * Rate limit de janela fixa sobre um Counter (memória ou Upstash).
 * O IP nunca vai para o store: a chave é um HMAC truncado (spec 005 D5).
 * Falha do store => permite a requisição (falha aberta, D6).
 */
export function createRateLimiter(opts: {
  counter: Counter;
  limit: number;
  windowMs: number;
  secret: string;
  now?: () => number;
}) {
  const now = opts.now ?? Date.now;

  function clientId(raw: string): string {
    return createHmac("sha256", opts.secret).update(raw).digest("base64url").slice(0, 22);
  }

  return {
    clientId,
    async check(rawClientKey: string): Promise<RateLimitResult> {
      const t = now();
      const window = Math.floor(t / opts.windowMs);
      try {
        const count = await opts.counter.incr(`rl:${clientId(rawClientKey)}:${window}`, opts.windowMs);
        if (count <= opts.limit) return { ok: true };
        const resetAt = (window + 1) * opts.windowMs;
        return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((resetAt - t) / 1000)) };
      } catch {
        logEvent("store_error", { operation: "rate_limit" });
        return { ok: true };
      }
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;
