import { withIdentity } from "@/lib/lives/identity";
import type { KickLivesService } from "@/lib/kick/service";
import { KICK_SLUG, type KickStatusService } from "@/lib/kick/status";
import type { LivesProvider } from "./types";

/** Tempo máximo que o agregador espera pela Kick (spec 048 D5): até 5 páginas de 1000. */
export const KICK_TIMEOUT_MS = 12_000;

/**
 * Provedor da Kick (spec 048). Só fica ativo com `kick` em LIVES_PROVIDERS e credenciais
 * presentes (spec 023 R4). Revalidação de status pelo slug do canal: spec 049.
 */
export function createKickProvider(service: KickLivesService | null, statusService?: KickStatusService | null): LivesProvider {
  return {
    platform: "kick",
    timeoutMs: KICK_TIMEOUT_MS,
    isConfigured: () => service !== null,
    async getLives() {
      if (!service) throw new Error("Kick não configurada");
      const r = await service.getLives();
      return { ...r, items: r.items.map(withIdentity) };
    },
    status: statusService
      ? {
          isValidId: (id) => KICK_SLUG.test(id),
          getStatus: (id) => statusService.getStatus(id),
        }
      : undefined,
  };
}
