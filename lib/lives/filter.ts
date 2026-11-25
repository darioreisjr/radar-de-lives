import type { LangFilter, LiveItem, SortOption } from "@/lib/lives/types";

export interface LiveFilters {
  q?: string;
  lang: LangFilter;
  sort: SortOption;
}

function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Filtro/ordenação puros sobre itens já buscados (D8: sem custo de quota). */
export function applyLiveFilters(items: readonly LiveItem[], f: LiveFilters): LiveItem[] {
  const needle = f.q ? fold(f.q.trim()) : "";
  const filtered = items.filter((it) => {
    if (f.lang !== "all" && it.language !== f.lang) return false;
    if (needle && !fold(`${it.title} ${it.channelTitle}`).includes(needle)) return false;
    return true;
  });

  const byRank = (a: LiveItem, b: LiveItem) => a.rank - b.rank;
  switch (f.sort) {
    case "viewers":
      // Sem contagem informada vai para o fim; não é tratado como zero.
      return filtered.sort((a, b) => {
        if (a.concurrentViewers === null && b.concurrentViewers === null) return byRank(a, b);
        if (a.concurrentViewers === null) return 1;
        if (b.concurrentViewers === null) return -1;
        return b.concurrentViewers - a.concurrentViewers || byRank(a, b);
      });
    case "recent": {
      const t = (it: LiveItem) => Date.parse(it.liveStartedAt ?? it.publishedAt ?? "") || 0;
      return filtered.sort((a, b) => t(b) - t(a) || byRank(a, b));
    }
    default:
      return filtered.sort(byRank);
  }
}
