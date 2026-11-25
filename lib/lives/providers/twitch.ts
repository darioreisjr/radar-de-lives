import type { TwitchLivesService } from "@/lib/twitch/service";
import { TWITCH_LOGIN, type TwitchStatusService } from "@/lib/twitch/status";
import type { LivesProvider } from "./types";

/** Tempo máximo que o agregador espera pela Twitch (spec 029 D5). */
export const TWITCH_TIMEOUT_MS = 12_000;

/**
 * Provedor da Twitch (spec 029). Só fica ativo com `twitch` em LIVES_PROVIDERS e
 * credenciais presentes (spec 023 R4; spec 029 D6). Revalidação de status: spec 030.
 */
export function createTwitchProvider(service: TwitchLivesService | null, statusService?: TwitchStatusService | null): LivesProvider {
  return {
    platform: "twitch",
    timeoutMs: TWITCH_TIMEOUT_MS,
    isConfigured: () => service !== null,
    async getLives() {
      if (!service) throw new Error("Twitch não configurada");
      return service.getLives();
    },
    status: statusService
      ? {
          isValidId: (id) => TWITCH_LOGIN.test(id),
          getStatus: (id) => statusService.getStatus(id),
        }
      : undefined,
  };
}
