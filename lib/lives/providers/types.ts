import type { LiveItem, LiveStatusPayload, Platform } from "@/lib/lives/types";

/** Revalidação de uma live antes de abrir o player (spec 024). */
export interface StatusCapability {
  /** Valida o formato do id antes de qualquer chamada externa. */
  isValidId(id: string): boolean;
  /** Lança LivesError em falha. */
  getStatus(id: string): Promise<LiveStatusPayload>;
}

/** Resultado de um provedor. Os itens já saem completos (com id, platform e sourceId). */
export interface ProviderResult {
  items: LiveItem[];
  updatedAt: string;
  cached: boolean;
  stale: boolean;
  /** Só o YouTube pagina por token (spec 022 D4). */
  nextPageToken: string | null;
}

/** Contrato de uma plataforma de lives (spec 022). */
export interface LivesProvider {
  platform: Platform;
  /** Falso quando faltam credenciais; o provedor fica de fora sem quebrar nada (spec 023). */
  isConfigured(): boolean;
  /**
   * Tempo máximo que o agregador espera por este provedor. Ausente = sem limite extra:
   * o próprio cliente do provedor controla seus timeouts (spec 022 D2).
   */
  timeoutMs?: number;
  /** Lança LivesError em falha. */
  getLives(opts: { pageToken?: string }): Promise<ProviderResult>;
  /** Ausente = a plataforma não oferece revalidação; a rota de status responde 400. */
  status?: StatusCapability;
}
