import type { TwitchLivesService } from "@/lib/twitch/service";
import type { LivesProvider } from "./types";

/** Tempo máximo que o agregador espera pela Twitch (spec 029 D5). */
export const TWITCH_TIMEOUT_MS = 12_000;

/**
 * Provedor da Twitch (spec 029). Só fica ativo com `twitch` em LIVES_PROVIDERS e
 * credenciais presentes (spec 023 R4; spec 029 D6). A revalidação de status entra na #42.
 */
export function createTwitchProvider(service: TwitchLivesService | null): LivesProvider {
  return {
    platform: "twitch",
    timeoutMs: TWITCH_TIMEOUT_MS,
    isConfigured: () => service !== null,
    async getLives() {
      if (!service) throw new Error("Twitch não configurada");
      return service.getLives();
    },
  };
}
