import "server-only";
import { HTTP_STATUS, PUBLIC_MESSAGES } from "@/lib/youtube/errors";
import type { LivesErrorCode, LivesErrorPayload } from "@/lib/youtube/types";

/** Em produção, o visitante não precisa de instruções de configuração (spec 003). */
const PRODUCTION_MISSING_KEY = "A busca de lives está indisponível no momento. Tente novamente mais tarde.";

export function errorResponse(code: LivesErrorCode, message?: string, retryAfterSeconds?: number) {
  message ??=
    code === "missing_api_key" && process.env.NODE_ENV === "production" ? PRODUCTION_MISSING_KEY : PUBLIC_MESSAGES[code];
  const body: LivesErrorPayload = { error: { code, message }, ...(retryAfterSeconds ? { retryAfterSeconds } : {}) };
  return Response.json(body, {
    status: HTTP_STATUS[code],
    headers: {
      "Cache-Control": "no-store",
      ...(retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : {}),
    },
  });
}

/** Chave do rate limit: primeiro IP de x-forwarded-for, depois x-real-ip. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "anon";
}
