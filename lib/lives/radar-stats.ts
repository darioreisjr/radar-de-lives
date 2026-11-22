import type { LiveItem, LiveLanguage } from "@/lib/youtube/types";

export interface LanguageShare {
  language: LiveLanguage;
  count: number;
  /** Fração do total, 0 a 1. */
  share: number;
}

const ORDER: LiveLanguage[] = ["pt", "en", "es", "unknown"];

/** Lives ao vivo por idioma estimado, da maior para a menor (empate segue pt, en, es, outro). Spec 007 D3. */
export function languageBreakdown(items: readonly LiveItem[]): LanguageShare[] {
  const live = items.filter((it) => it.isLive);
  const total = live.length;
  if (total === 0) return [];
  const counts = new Map<LiveLanguage, number>();
  for (const it of live) counts.set(it.language, (counts.get(it.language) ?? 0) + 1);
  return ORDER.filter((l) => counts.has(l))
    .map((language) => ({ language, count: counts.get(language)!, share: counts.get(language)! / total }))
    .sort((a, b) => b.count - a.count || ORDER.indexOf(a.language) - ORDER.indexOf(b.language));
}

/** Live com o maior público INFORMADO. Ausência de contagem nunca conta como zero; null se ninguém informa. */
export function topAudience(items: readonly LiveItem[]): LiveItem | null {
  let best: LiveItem | null = null;
  for (const it of items) {
    if (!it.isLive || it.concurrentViewers === null) continue;
    if (!best || it.concurrentViewers > (best.concurrentViewers ?? -1)) best = it;
  }
  return best;
}

export function liveCount(items: readonly LiveItem[]): number {
  return items.filter((it) => it.isLive).length;
}
