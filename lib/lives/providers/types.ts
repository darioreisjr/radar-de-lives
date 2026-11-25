import type { LiveItem, Platform } from "@/lib/lives/types";

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
}
