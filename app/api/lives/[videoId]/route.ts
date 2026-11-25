import type { NextRequest } from "next/server";
import { getStatusHandler } from "@/lib/lives/server";

/**
 * Revalida um vídeo do YouTube antes de abrir o player (spec 002).
 * @deprecated Use /api/status/youtube/[id] (spec 024). Mantida com a mesma resposta e as
 * mesmas mensagens; a remoção fica para a consolidação (#57).
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/lives/[videoId]">) {
  const { videoId } = await ctx.params;
  return getStatusHandler()(request, "youtube", videoId, { idLabel: "videoId", route: "/api/lives/[videoId]" });
}
