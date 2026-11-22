import type { BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Remove query string e fragmento da URL antes de enviar ao Vercel Web Analytics (spec 006 D2).
 * Evita que parâmetros futuros (ex.: termos de busca) cheguem ao analytics.
 */
export function stripQuery<T extends Pick<BeforeSendEvent, "url">>(event: T): T {
  try {
    const u = new URL(event.url);
    return { ...event, url: `${u.origin}${u.pathname}` };
  } catch {
    return { ...event, url: event.url.split(/[?#]/)[0] };
  }
}
