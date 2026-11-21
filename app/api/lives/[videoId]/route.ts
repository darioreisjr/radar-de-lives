import type { NextRequest } from "next/server";
import { clientKey, errorResponse } from "@/lib/lives/http";
import { getRouteRateLimit, getVideoStatusService } from "@/lib/lives/server";
import { logEvent } from "@/lib/telemetry";
import { LivesError } from "@/lib/youtube/errors";
import { VIDEO_ID } from "@/lib/youtube/normalize";

/** Revalida um vídeo antes de abrir o player (spec 002). */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/lives/[videoId]">) {
  const limited = getRouteRateLimit().check(clientKey(request));
  if (!limited.ok) return errorResponse("rate_limited", undefined, limited.retryAfterSeconds);

  const { videoId } = await ctx.params;
  if (!VIDEO_ID.test(videoId)) return errorResponse("invalid_params", "Parâmetros inválidos: videoId inválido");

  try {
    const body = await getVideoStatusService().getStatus(videoId);
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof LivesError) return errorResponse(e.code, undefined, e.retryAfterSeconds);
    logEvent("route_error", { route: "/api/lives/[videoId]" });
    return errorResponse("upstream_unavailable");
  }
}
