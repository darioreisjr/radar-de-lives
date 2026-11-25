import type { LiveItem, Platform } from "./types";

/** Chave única entre plataformas (spec 021 D2). */
export function liveId(platform: Platform, sourceId: string): string {
  return `${platform}:${sourceId}`;
}

/** Remove duplicatas por `id`, mantendo a primeira ocorrência (melhor posição). */
export function dedupeById<T extends Pick<LiveItem, "id">>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/**
 * Prefixo de id do DOM para um item (spec 021 D3).
 * YouTube: `live-<videoId>`, idêntico ao de antes da Fase 1.
 * Outras plataformas: `live-<platform>-<sourceId>`, só com caracteres seguros.
 */
export function liveDomId(item: Pick<LiveItem, "platform" | "sourceId">): string {
  const safe = item.sourceId.replace(/[^A-Za-z0-9_-]/g, "_");
  return item.platform === "youtube" ? `live-${safe}` : `live-${item.platform}-${safe}`;
}
