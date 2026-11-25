/**
 * Telemetria mínima (spec 003 D5): um evento JSON por linha no log do servidor.
 * Nunca inclua IP, chave de API, URLs do YouTube (contêm a chave) ou dados pessoais.
 */
export type TelemetryEvent =
  | "youtube_call"
  | "youtube_error"
  | "budget_exhausted"
  | "stale_served"
  | "route_error"
  | "store_error"
  | "store_memory_in_production"
  /** Uma plataforma falhou e as outras responderam (spec 022). Só platform e code. */
  | "provider_failed"
  /** LIVES_PROVIDERS com valores desconhecidos (spec 023). Só a quantidade, nunca o texto. */
  | "config_warning"
  /** Plataforma listada em LIVES_PROVIDERS que ficou de fora (spec 023). */
  | "provider_disabled";

export type TelemetryFields = Record<string, string | number | boolean | null>;

export type Logger = (evt: TelemetryEvent, fields?: TelemetryFields) => void;

export const logEvent: Logger = (evt, fields = {}) => {
  const line = JSON.stringify({ ts: new Date().toISOString(), evt, ...fields });
  const warn = evt === "youtube_error" || evt === "route_error" || evt === "budget_exhausted" || evt === "provider_failed" || evt === "config_warning" || evt === "provider_disabled" || evt.startsWith("store_");
  if (warn) console.warn(line);
  else console.info(line);
};
