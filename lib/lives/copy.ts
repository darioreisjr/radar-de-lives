import { platformMeta, type PlatformMeta } from "@/lib/lives/platforms";
import type { Platform } from "@/lib/lives/types";

/**
 * Textos do site conforme as plataformas ativas (spec 034).
 * Com só o YouTube, cada função devolve exatamente o texto de antes (CA1).
 */

type Form = keyof Pick<PlatformMeta, "label" | "inLabel" | "ofLabel" | "apiLabel">;

/** Lista em pt-BR: "no YouTube", "no YouTube e na Twitch", "no YouTube, na Twitch e na Kick". */
export function formatPlatformList(platforms: readonly Platform[], form: Form = "inLabel"): string {
  const parts = (platforms.length ? platforms : (["youtube"] as const)).map((p) => platformMeta(p)[form]);
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
}

const isMulti = (platforms: readonly Platform[]) => platforms.length > 1;

/** Descrição da metadata e do Open Graph. */
export function siteDescription(platforms: readonly Platform[]): string {
  return `Encontre transmissões públicas de GTA 6 ao vivo ${formatPlatformList(platforms)}.`;
}

/** Nota de cobertura ("Lives encontradas", nunca "todas"; PRD D9). */
export function coverageNote(platforms: readonly Platform[]): string {
  if (!isMulti(platforms)) {
    return `Mostramos lives encontradas pela busca pública ${formatPlatformList(platforms, "apiLabel")}. A busca depende de títulos, idioma e região, e não garante cobertura completa.`;
  }
  return `Mostramos lives encontradas pelas buscas públicas ${formatPlatformList(platforms, "apiLabel")}. As buscas dependem de títulos, categoria, idioma e região, e não garantem cobertura completa.`;
}

/** Frase do hero e da imagem OG: "Transmissões públicas encontradas no YouTube, reunidas em um só lugar". */
export function heroLead(platforms: readonly Platform[]): string {
  return `Transmissões públicas encontradas ${formatPlatformList(platforms)}, reunidas em um só lugar`;
}

/** Onde a live pode ser assistida fora do site: "no YouTube" ou "na plataforma de origem". */
export function watchElsewhere(platforms: readonly Platform[]): string {
  return isMulti(platforms) ? "na plataforma de origem" : formatPlatformList(platforms);
}

/** Origem das miniaturas no aviso de aceite: "do YouTube" / "do YouTube e da Twitch". */
export function thumbnailsSource(platforms: readonly Platform[]): string {
  return formatPlatformList(platforms, "ofLabel");
}

/** Texto do radar quando a busca falhou: "a consulta ao YouTube" / "a busca". */
export function searchSubject(platforms: readonly Platform[]): string {
  return isMulti(platforms) ? "a busca" : "a consulta ao YouTube";
}
