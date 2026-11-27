import { withIdentity } from "@/lib/lives/identity";
import { VIDEO_ID } from "@/lib/youtube/normalize";
import type { LivesService } from "@/lib/youtube/service";
import type { VideoStatusService } from "@/lib/youtube/video-status";
import type { LivesProvider } from "./types";

/**
 * Adaptador do serviço do YouTube (spec 022). Não muda quota, cache, trava nem orçamento:
 * só delega. O cache continua no namespace "lives" com as mesmas chaves (D1).
 * A revalidação (spec 024) delega ao VideoStatusService, com o mesmo cache de 60 s.
 */
export function createYoutubeProvider(
  service: LivesService,
  configured: boolean,
  statusService?: VideoStatusService,
): LivesProvider {
  return {
    platform: "youtube",
    isConfigured: () => configured,
    async getLives({ pageToken }) {
      const r = await service.getLives(pageToken);
      // Itens do cache em formatos antigos (specs 021 e 053; incidente do #64).
      return { ...r, items: r.items.map(withIdentity) };
    },
    status: statusService && {
      isValidId: (id) => VIDEO_ID.test(id),
      async getStatus(id) {
        // Payload público sem `videoId` (spec 053 D3).
        const { videoId, ...s } = await statusService.getStatus(id);
        return { ...s, platform: "youtube", sourceId: videoId };
      },
    },
  };
}
