import { describe, expect, it } from "vitest";
import { explorerReducer, initialExplorerState, type ExplorerState } from "@/lib/lives/explorer-state";
import type { LiveItem, LivesPayload } from "@/lib/lives/types";

const item = (videoId: string, rank: number, extra: Partial<LiveItem> = {}): LiveItem => ({
  id: `youtube:${videoId}`, platform: "youtube", sourceId: videoId,
  videoId, title: videoId, description: "", channelId: "c", channelTitle: "c", thumbnailUrl: null,
  publishedAt: null, liveStartedAt: null, concurrentViewers: null, language: "unknown",
  watchUrl: `https://www.youtube.com/watch?v=${videoId}`, embedUrl: "", isLive: true, embedAllowed: true, isMature: false, rank, ...extra,
});
const payload = (items: LiveItem[], next: string | null = null): LivesPayload => ({
  items, updatedAt: "2026-11-21T12:00:00.000Z", cached: false, stale: false, nextPageToken: next, source: "youtube",
});

function loaded(items: LiveItem[], next: string | null = null): ExplorerState {
  return explorerReducer(initialExplorerState, { type: "loaded", payload: payload(items, next) });
}

describe("explorerReducer", () => {
  it("carregar mais acrescenta depois, sem duplicar", () => {
    const s = explorerReducer(loaded([item("a", 0), item("b", 1)], "N"), {
      type: "more-loaded",
      payload: payload([item("b", 0), item("c", 1)]),
    });
    expect(s.items.map((i) => i.videoId)).toEqual(["a", "b", "c"]);
    expect(s.items.find((i) => i.videoId === "c")!.rank).toBeGreaterThan(1);
    expect(s.next).toBeNull();
  });

  it("falha ao atualizar mantém a grade com aviso", () => {
    const s = explorerReducer(loaded([item("a", 0)]), { type: "failed", error: { code: "quota_exceeded", message: "m" } });
    expect(s.phase).toBe("ready");
    expect(s.items).toHaveLength(1);
    expect(s.error?.code).toBe("quota_exceeded");
  });

  it("falha sem itens vai para estado de erro", () => {
    const s = explorerReducer(initialExplorerState, { type: "failed", error: { code: "network", message: "m" } });
    expect(s.phase).toBe("error");
  });

  it("revalidação encerrada marca o item e limpa audiência (CA9)", () => {
    const s = explorerReducer(loaded([item("a", 0, { concurrentViewers: 50 })]), {
      type: "item-status",
      status: { videoId: "a", state: "ended", embedAllowed: "unknown", concurrentViewers: null, checkedAt: "", cached: false },
    });
    expect(s.items[0].isLive).toBe(false);
    expect(s.items[0].concurrentViewers).toBeNull();
    expect(s.items[0].embedAllowed).toBe(true);
  });

  it("revalidação ao vivo sem contagem não apaga a anterior nem vira zero", () => {
    const s = explorerReducer(loaded([item("a", 0, { concurrentViewers: 50 })]), {
      type: "item-status",
      status: { videoId: "a", state: "live", embedAllowed: false, concurrentViewers: null, checkedAt: "", cached: false },
    });
    expect(s.items[0].concurrentViewers).toBe(50);
    expect(s.items[0].embedAllowed).toBe(false);
  });
});
