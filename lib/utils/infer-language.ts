import type { LiveLanguage } from "@/lib/youtube/types";

/** Código base de metadado (ex.: "pt-BR" → "pt"); undefined se vazio. */
function baseCode(code: string | undefined): string | undefined {
  const base = code?.trim().toLowerCase().split(/[-_]/)[0];
  return base || undefined;
}

// Pistas fortes por idioma. Palavras comuns a pt e es (ex.: "explorando") ficam de fora (spec 004 D5).
const PT_HINTS = /\b(ao vivo|jogando|zerando|portugu[eê]s|pt-?br|brasil|agora)\b/i;
const ES_HINTS = /\b(en vivo|en directo|directo|espa[nñ]ol|jugando|ahora)\b/i;
// Idioma explícito fora de pt/en/es. "India" sozinho não conta: é lugar, não idioma (D3).
const OTHER_HINTS = /\b(hindi|telugu|tamil|urdu|bangla|bengali|marathi|malayalam|kannada|arabic)\b/i;
// Escritas não latinas: cirílico, árabe, devanágari e demais índicas, tailandês, kana, CJK, hangul.
const NON_LATIN = /[Ѐ-ӿ؀-ۿऀ-෿฀-๿぀-ヿ一-鿿가-힯]/;

export function titleSignal(title: string | undefined): "pt" | "es" | "other" | null {
  if (!title) return null;
  if (OTHER_HINTS.test(title) || NON_LATIN.test(title)) return "other";
  if (PT_HINTS.test(title)) return "pt";
  if (ES_HINTS.test(title)) return "es";
  return null;
}

/**
 * Idioma ESTIMADO (spec 001 D11, calibrado na spec 004).
 * - Metadado pt/es é confiável (D2).
 * - Metadado de outro idioma (ex.: "hi") → unknown (D4).
 * - Metadado "en" é fraco: muitos canais deixam o padrão; título com pista forte vence (D1, D3).
 * - "live"/"stream" aparecem em todos os idiomas e nunca indicam inglês.
 */
export function inferLanguage(input: {
  defaultAudioLanguage?: string;
  defaultLanguage?: string;
  title?: string;
}): LiveLanguage {
  const meta = baseCode(input.defaultAudioLanguage) ?? baseCode(input.defaultLanguage);
  if (meta === "pt" || meta === "es") return meta;
  if (meta && meta !== "en") return "unknown";

  const signal = titleSignal(input.title);
  if (signal === "other") return "unknown";
  if (signal) return signal;
  return meta === "en" ? "en" : "unknown";
}
