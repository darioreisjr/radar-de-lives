import type { NextRequest } from "next/server";
import { applyLiveFilters } from "@/lib/lives/filter";
import { getLivesAggregator, getRouteRateLimit } from "@/lib/lives/server";
import { parseLivesQuery } from "@/lib/validation/lives-query";
import { clientKey, errorResponse } from "@/lib/lives/http";
import { logEvent } from "@/lib/telemetry";
import { LivesError } from "@/lib/youtube/errors";
import type { LivesPayload } from "@/lib/youtube/types";

export async function GET(request: NextRequest) {
  const limited = await getRouteRateLimit().check(clientKey(request));
  if (!limited.ok) return errorResponse("rate_limited", undefined, limited.retryAfterSeconds);

  const parsed = parseLivesQuery(request.nextUrl.searchParams);
  if (!parsed.ok) return errorResponse("invalid_params", `Parâmetros inválidos: ${parsed.message}`);
  const { q, lang, sort, pageToken } = parsed.data;

  try {
    // Agregador (spec 022): isola falhas por plataforma. Por enquanto, só o YouTube.
    const result = await getLivesAggregator().getLives(pageToken);
    const body: LivesPayload = {
      // Filtros depois da agregação (plano, seção 3). Os itens já vêm completos (withIdentity no provedor).
      items: applyLiveFilters(result.items, { q, lang, sort }),
      updatedAt: result.updatedAt,
      cached: result.cached,
      stale: result.stale,
      nextPageToken: result.nextPageToken,
      source: "youtube",
      sources: result.sources,
    };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof LivesError) return errorResponse(e.code, undefined, e.retryAfterSeconds);
    logEvent("route_error", { route: "/api/lives" });
    return errorResponse("upstream_unavailable");
  }
}
