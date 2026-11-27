import "server-only";
import { clientKey, errorResponse } from "@/lib/lives/http";
import type { LivesProvider } from "@/lib/lives/providers/types";
import type { RateLimiter } from "@/lib/rate-limit/rate-limiter";
import { logEvent, type Logger } from "@/lib/telemetry";
import { LivesError } from "@/lib/youtube/errors";

export interface StatusHandlerDeps {
  rateLimit: () => RateLimiter;
  /** Provedores ativos (selecionados por LIVES_PROVIDERS). */
  providers: () => readonly LivesProvider[];
  log?: Logger;
}

/**
 * Handler de /api/status/[platform]/[id] (spec 024; a rota antiga /api/lives/[videoId] saiu na spec 053).
 * Ordem igual à da rota original: rate limit, validação, provedor (D2).
 */
export function createStatusHandler(deps: StatusHandlerDeps) {
  const log = deps.log ?? logEvent;

  return async function handle(
    request: Request,
    platform: string,
    id: string,
    opts: { route: string },
  ): Promise<Response> {
    const limited = await deps.rateLimit().check(clientKey(request));
    if (!limited.ok) return errorResponse("rate_limited", undefined, limited.retryAfterSeconds);

    // Só plataformas ativas e com revalidação (D1).
    const status = deps.providers().find((p) => p.platform === platform)?.status;
    if (!status) return errorResponse("invalid_params", "Parâmetros inválidos: plataforma inválida");
    if (!status.isValidId(id)) {
      return errorResponse("invalid_params", "Parâmetros inválidos: id inválido");
    }

    try {
      const body = await status.getStatus(id);
      return Response.json(body, { headers: { "Cache-Control": "no-store" } });
    } catch (e) {
      if (e instanceof LivesError) return errorResponse(e.code, undefined, e.retryAfterSeconds);
      log("route_error", { route: opts.route });
      return errorResponse("upstream_unavailable");
    }
  };
}

export type StatusHandler = ReturnType<typeof createStatusHandler>;
