import type { LiveItem, Platform } from "./types";

/** Chave única entre plataformas (spec 021 D2). */
export function liveId(platform: Platform, sourceId: string): string {
  return `${platform}:${sourceId}`;
}

/** Item como pode estar gravado no cache: formatos anteriores às specs 021 e 053. */
export type CachedLiveItem = Omit<LiveItem, "id" | "platform" | "sourceId" | "isMature"> &
  Partial<Pick<LiveItem, "id" | "platform" | "sourceId" | "isMature">> & {
    /** Campo removido na spec 053; itens gravados antes ainda o têm. */
    videoId?: string;
  };

/**
 * Normaliza um item vindo do cache (specs 021 e 053):
 * - itens de antes da spec 021 só tinham `videoId`: sem isso, chegariam com `id` indefinido
 *   e o dedupe por `id` deixaria um único item (incidente da #63);
 * - itens de antes da spec 053 ainda trazem `videoId`, que não sai mais no payload.
 */
export function withIdentity(cached: CachedLiveItem): LiveItem {
  const { videoId, ...item } = cached;
  const platform: Platform = item.platform ?? "youtube";
  const sourceId = item.sourceId ?? videoId ?? "";
  return { ...item, platform, sourceId, id: item.id ?? liveId(platform, sourceId), isMature: item.isMature ?? false };
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
 * YouTube: `live-<id do vídeo>`, idêntico ao de antes da Fase 1.
 * Outras plataformas: `live-<platform>-<sourceId>`, só com caracteres seguros.
 */
export function liveDomId(item: Pick<LiveItem, "platform" | "sourceId">): string {
  const safe = item.sourceId.replace(/[^A-Za-z0-9_-]/g, "_");
  return item.platform === "youtube" ? `live-${safe}` : `live-${item.platform}-${safe}`;
}
