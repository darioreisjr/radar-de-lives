/**
 * Telemetria mínima (spec 003 D5): um evento JSON por linha no log do servidor.
 * Nunca inclua IP, chave de API, URLs do YouTube (contêm a chave) ou dados pessoais.
 */
export type TelemetryEvent =
  | "youtube_call"
  | "youtube_error"
  | "budget_exhausted"
  | "stale_served"
  | "route_error";

export type TelemetryFields = Record<string, string | number | boolean | null>;

export type Logger = (evt: TelemetryEvent, fields?: TelemetryFields) => void;

export const logEvent: Logger = (evt, fields = {}) => {
  const line = JSON.stringify({ ts: new Date().toISOString(), evt, ...fields });
  if (evt === "youtube_error" || evt === "route_error" || evt === "budget_exhausted") console.warn(line);
  else console.info(line);
};
