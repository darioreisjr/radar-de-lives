import { siteConfig } from "@/lib/config/site";

/**
 * Aceite da Política de Privacidade e dos Termos (spec 016).
 * Exigido pelas Developer Policies do YouTube antes de liberar as funcionalidades do cliente da API.
 * Fica só no localStorage do navegador; nunca é enviado ao servidor.
 */
export const POLICY_STORAGE_KEY = "radar-de-lives:policy-acceptance";

/** A versão é a data de atualização das páginas legais: mudou a data, o aceite é pedido de novo. */
export const POLICY_VERSION = siteConfig.legal.updatedAt;

export interface PolicyAcceptance {
  version: string;
  acceptedAt: string;
}

/** true se o valor guardado é um aceite válido da versão vigente. */
export function isAccepted(raw: string | null, version: string = POLICY_VERSION): boolean {
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as Partial<PolicyAcceptance> | null;
    return (
      typeof data === "object" &&
      data !== null &&
      data.version === version &&
      typeof data.acceptedAt === "string" &&
      !Number.isNaN(Date.parse(data.acceptedAt))
    );
  } catch {
    return false;
  }
}

export function serializeAcceptance(version: string = POLICY_VERSION, now: Date = new Date()): string {
  const value: PolicyAcceptance = { version, acceptedAt: now.toISOString() };
  return JSON.stringify(value);
}

/** Leitura tolerante: sem localStorage (modo privado, bloqueio), conta como não aceito. */
export function readAcceptance(storage: Pick<Storage, "getItem"> | undefined): boolean {
  try {
    return isAccepted(storage?.getItem(POLICY_STORAGE_KEY) ?? null);
  } catch {
    return false;
  }
}

/** Gravação tolerante: devolve false se o navegador recusar. O aceite ainda vale para a página aberta. */
export function writeAcceptance(storage: Pick<Storage, "setItem"> | undefined, now: Date = new Date()): boolean {
  try {
    if (!storage) return false;
    storage.setItem(POLICY_STORAGE_KEY, serializeAcceptance(POLICY_VERSION, now));
    return true;
  } catch {
    return false;
  }
}
