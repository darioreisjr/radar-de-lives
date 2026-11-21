import type { LivesErrorCode } from "./types";

export class LivesError extends Error {
  constructor(
    readonly code: LivesErrorCode,
    readonly retryAfterSeconds?: number,
  ) {
    super(code);
    this.name = "LivesError";
  }
}

/** Mensagens públicas seguras (sem detalhes do provedor nem segredos). */
export const PUBLIC_MESSAGES: Record<LivesErrorCode, string> = {
  missing_api_key:
    "A busca no YouTube ainda não está configurada neste servidor. Defina YOUTUBE_API_KEY em .env.local (veja .env.example) e reinicie o servidor.",
  quota_exceeded:
    "O limite diário de consultas ao YouTube foi atingido. A quota é renovada à meia-noite no horário do Pacífico (EUA).",
  rate_limited: "Muitas solicitações em pouco tempo. Aguarde alguns segundos e tente novamente.",
  upstream_unavailable: "O YouTube não respondeu a tempo. Tente novamente em instantes.",
  upstream_config:
    "O YouTube recusou a consulta. Verifique se a chave é válida e se a YouTube Data API v3 está ativada no projeto do Google Cloud.",
  invalid_params: "Parâmetros inválidos.",
};

export const HTTP_STATUS: Record<LivesErrorCode, number> = {
  missing_api_key: 503,
  quota_exceeded: 503,
  rate_limited: 429,
  upstream_unavailable: 502,
  upstream_config: 502,
  invalid_params: 400,
};

/** Extrai "reason" do corpo de erro do Google (formato errors[] ou details[]). */
export function extractReason(body: unknown): string | undefined {
  const err = (body as { error?: { errors?: { reason?: string }[]; details?: { reason?: string }[] } })?.error;
  return err?.errors?.find((e) => e.reason)?.reason ?? err?.details?.find((d) => d.reason)?.reason;
}

export function mapUpstreamError(status: number, reason: string | undefined): LivesError {
  const r = (reason ?? "").toLowerCase();
  if (r === "quotaexceeded" || r === "dailylimitexceeded" || r === "rate_limit_exceeded_daily") {
    return new LivesError("quota_exceeded");
  }
  if (status === 429 || r === "ratelimitexceeded" || r === "userratelimitexceeded") {
    return new LivesError("rate_limited", 60);
  }
  if (status >= 500) return new LivesError("upstream_unavailable");
  // 403/400 sem motivo de quota: chave inválida, API desativada, restrição de referer etc.
  return new LivesError("upstream_config");
}
