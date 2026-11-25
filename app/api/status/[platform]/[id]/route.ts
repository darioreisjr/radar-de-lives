import type { NextRequest } from "next/server";
import { getStatusHandler } from "@/lib/lives/server";

/** Revalida uma live de qualquer plataforma ativa antes de abrir o player (spec 024). */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/status/[platform]/[id]">) {
  const { platform, id } = await ctx.params;
  return getStatusHandler()(request, platform, id, { route: "/api/status/[platform]/[id]" });
}
