import type { Platform, SourceStatus } from "@/lib/lives/types";

/**
 * Plataformas ativas segundo o servidor (spec 026 D1). Sem `sources` (payload antigo
 * ou simulado), vale só o YouTube. Uma fonte que falhou continua ativa.
 */
export function activePlatforms(sources: readonly SourceStatus[] | undefined): Platform[] {
  return sources?.length ? sources.map((s) => s.platform) : ["youtube"];
}

/** Interface multiplataforma só com 2 ou mais plataformas ativas (spec 026 D2). */
export function isMultiPlatform(sources: readonly SourceStatus[] | undefined): boolean {
  return activePlatforms(sources).length > 1;
}

/** Alguma fonte falhou e outra respondeu: resultado parcial (spec 026 CA4). */
export function hasPartialFailure(sources: readonly SourceStatus[] | undefined): boolean {
  return !!sources && sources.some((s) => !s.ok) && sources.some((s) => s.ok);
}
