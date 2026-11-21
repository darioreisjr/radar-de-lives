import type { NextRequest } from "next/server";
import { applyLiveFilters } from "@/lib/lives/filter";
import { getLivesService, getRouteRateLimit } from "@/lib/lives/server";
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
    const result = await getLivesService().getLives(pageToken);
    const body: LivesPayload = {
      items: applyLiveFilters(result.items, { q, lang, sort }),
      updatedAt: result.updatedAt,
      cached: result.cached,
      stale: result.stale,
      nextPageToken: result.nextPageToken,
      source: "youtube",
    };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof LivesError) return errorResponse(e.code, undefined, e.retryAfterSeconds);
    logEvent("route_error", { route: "/api/lives" });
    return errorResponse("upstream_unavailable");
  }
}
