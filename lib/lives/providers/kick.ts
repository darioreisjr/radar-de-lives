import { withIdentity } from "@/lib/lives/identity";
import type { KickLivesService } from "@/lib/kick/service";
import type { LivesProvider } from "./types";

/** Tempo máximo que o agregador espera pela Kick (spec 048 D5): até 5 páginas de 1000. */
export const KICK_TIMEOUT_MS = 12_000;

/**
 * Provedor da Kick (spec 048). Só fica ativo com `kick` em LIVES_PROVIDERS e credenciais
 * presentes (spec 023 R4). Sem revalidação de status até a #51: /api/status/kick/<id> → 400.
 */
export function createKickProvider(service: KickLivesService | null): LivesProvider {
  return {
    platform: "kick",
    timeoutMs: KICK_TIMEOUT_MS,
    isConfigured: () => service !== null,
    async getLives() {
      if (!service) throw new Error("Kick não configurada");
      const r = await service.getLives();
      return { ...r, items: r.items.map(withIdentity) };
    },
  };
}
