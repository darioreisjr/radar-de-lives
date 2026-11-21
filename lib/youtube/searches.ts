/**
 * Termos iniciais do PRD (§3, P0-2). Editáveis aqui.
 *
 * Decisão D1 (spec 001): os termos são unidos com o operador OR (`|`), documentado
 * no parâmetro `q` de search.list, para gastar UMA chamada do bucket de 100
 * buscas/dia por atualização, em vez de uma por termo.
 */
export const LIVE_SEARCH_TERMS = [
  "GTA 6 live",
  "GTA VI live",
  "GTA 6 ao vivo",
  "GTA 6 gameplay live",
  "GTA 6 stream",
  "Grand Theft Auto VI live",
  "GTA 6 en vivo",
] as const;

export function buildCombinedQuery(terms: readonly string[] = LIVE_SEARCH_TERMS): string {
  return terms
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.includes(" ") ? `"${t}"` : t))
    .join("|");
}
