import { withIdentity } from "@/lib/lives/identity";
import type { LivesService } from "@/lib/youtube/service";
import type { LivesProvider } from "./types";

/**
 * Adaptador do serviço do YouTube (spec 022). Não muda quota, cache, trava nem orçamento:
 * só delega. O cache continua no namespace "lives" com as mesmas chaves (D1).
 */
export function createYoutubeProvider(service: LivesService, configured: boolean): LivesProvider {
  return {
    platform: "youtube",
    isConfigured: () => configured,
    async getLives({ pageToken }) {
      const r = await service.getLives(pageToken);
      // Itens gravados no cache antes da spec 021 não têm id/platform (D8, incidente do #64).
      return { ...r, items: r.items.map(withIdentity) };
    },
  };
}
