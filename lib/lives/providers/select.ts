import type { Platform } from "@/lib/lives/types";
import type { LivesProvider } from "./types";

/** Plataformas que LIVES_PROVIDERS reconhece (spec 023). */
export const KNOWN_PLATFORMS: readonly Platform[] = ["youtube", "twitch", "kick"];

const DEFAULT: Platform[] = ["youtube"];

/**
 * Lê LIVES_PROVIDERS (spec 023 R1 a R3).
 * Ausente, vazia ou sem nenhum valor conhecido → ["youtube"].
 */
export function parseProviderList(raw: string | null | undefined): { platforms: Platform[]; ignored: number } {
  const tokens = (raw ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const platforms: Platform[] = [];
  let ignored = 0;
  for (const t of tokens) {
    const known = KNOWN_PLATFORMS.find((p) => p === t);
    if (!known) ignored++;
    else if (!platforms.includes(known)) platforms.push(known);
  }
  return { platforms: platforms.length ? platforms : [...DEFAULT], ignored };
}

export type DisabledReason = "not_implemented" | "not_configured";

/**
 * Escolhe os provedores ativos (spec 023 R4 a R7).
 * - Plataforma sem implementação ou (exceto YouTube) sem credenciais fica de fora.
 * - YouTube listado entra mesmo sem chave, para manter o estado "busca não configurada" (R5).
 * - Se nada sobrar, volta para o YouTube (R6).
 */
export function selectProviders(
  platforms: readonly Platform[],
  candidates: Partial<Record<Platform, LivesProvider>>,
): { providers: LivesProvider[]; disabled: { platform: Platform; reason: DisabledReason }[] } {
  const providers: LivesProvider[] = [];
  const disabled: { platform: Platform; reason: DisabledReason }[] = [];
  for (const platform of platforms) {
    const candidate = candidates[platform];
    if (!candidate) disabled.push({ platform, reason: "not_implemented" });
    else if (platform !== "youtube" && !candidate.isConfigured()) disabled.push({ platform, reason: "not_configured" });
    else providers.push(candidate);
  }
  if (providers.length === 0 && candidates.youtube) providers.push(candidates.youtube);
  return { providers, disabled };
}
