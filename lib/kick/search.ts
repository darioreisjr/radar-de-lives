import "server-only";
import type { LiveItem } from "@/lib/lives/types";
import { logEvent, type Logger } from "@/lib/telemetry";
import type { KickClient } from "./client";
import { kickLanguage, kickViewers, normalizeLivestream } from "./normalize";
import { KickLivestreamSchema, KickLivestreamsPageSchema, type KickLivestream } from "./types";

export interface KickSearchOptions {
  categoryId: string;
  /** Teto de páginas de 1000 (D1). */
  maxPages?: number;
  /** Tamanho da lista depois de ordenar (D5): o mesmo da Twitch. */
  maxItems?: number;
  log?: Logger;
}

export const KICK_PAGE_LIMIT = 1000;
export const KICK_DEFAULT_MAX_PAGES = 5;
export const KICK_DEFAULT_MAX_ITEMS = 100;

/**
 * Busca lives de GTA 6 na Kick e devolve LiveItem[] (spec 047).
 * A API devolve da live mais antiga para a mais nova: segue o cursor, filtra pt/en/es,
 * ordena por espectadores e fica com as maiores.
 */
export async function searchKickLives(client: KickClient, opts: KickSearchOptions): Promise<LiveItem[]> {
  const log = opts.log ?? logEvent;
  const maxPages = opts.maxPages ?? KICK_DEFAULT_MAX_PAGES;
  const maxItems = opts.maxItems ?? KICK_DEFAULT_MAX_ITEMS;

  const lives: KickLivestream[] = [];
  const seen = new Set<string>();
  let invalid = 0;
  let cursor: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    let res;
    try {
      res = await client.api(
        "v2/livestreams",
        { category_id: opts.categoryId, limit: String(KICK_PAGE_LIMIT), ...(cursor ? { cursor } : {}) },
        KickLivestreamsPageSchema,
      );
    } catch (e) {
      // 1ª página: o erro sobe; seguintes: ficam as páginas já obtidas (D2).
      if (page === 0) throw e;
      log("kick_error", { stage: "page", page });
      break;
    }
    for (const raw of res.data) {
      const parsed = KickLivestreamSchema.safeParse(raw);
      if (!parsed.success) {
        invalid++;
        continue;
      }
      const slug = parsed.data.channel.slug.toLowerCase();
      if (seen.has(slug)) continue;
      seen.add(slug);
      lives.push(parsed.data);
    }
    cursor = res.pagination?.next_cursor || undefined;
    if (!cursor || res.data.length === 0) break;
  }
  if (invalid > 0) log("kick_error", { stage: "normalize", code: "invalid_item", count: invalid });

  return lives
    .filter((s) => kickLanguage(s.language_code) !== "unknown") // PRD D7 (D4)
    .map((s) => ({ s, viewers: kickViewers(s.viewer_count) }))
    .sort((a, b) => (b.viewers ?? -1) - (a.viewers ?? -1)) // sem número por último (D5)
    .slice(0, maxItems)
    .map(({ s }, rank) => normalizeLivestream(s, rank));
}
