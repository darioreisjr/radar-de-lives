const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("pt-BR");
const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

/** null => "Não informado". Nunca converte ausência em 0. */
export function formatViewers(n: number | null): { short: string; full: string } {
  if (n === null) return { short: "Não informado", full: "Espectadores: não informado" };
  return { short: compact.format(n), full: `${full.format(n)} espectadores agora` };
}

export function formatClock(iso: string): string {
  return time.format(new Date(iso));
}

export function formatRelative(iso: string | null, now = Date.now()): string | null {
  if (!iso) return null;
  const diffMin = Math.round((Date.parse(iso) - now) / 60_000);
  if (Number.isNaN(diffMin)) return null;
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 48) return rtf.format(diffH, "hour");
  return rtf.format(Math.round(diffH / 24), "day");
}

export const LANGUAGE_LABEL = { pt: "Português", en: "Inglês", es: "Espanhol", unknown: "Outro / não identificado" } as const;
