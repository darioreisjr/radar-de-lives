import { describe, expect, it } from "vitest";
import { getDemoLives } from "@/lib/fixtures/lives";
import { explorerReducer, initialExplorerState } from "@/lib/lives/explorer-state";
import { dedupeById, liveDomId, liveId, withIdentity } from "@/lib/lives/identity";
import type { LiveItem } from "@/lib/lives/types";
import { normalizeLives } from "@/lib/youtube/normalize";

describe("identidade multiplataforma (spec 021)", () => {
  it("liveId junta plataforma e id de origem (D2)", () => {
    expect(liveId("youtube", "abc")).toBe("youtube:abc");
    expect(liveId("twitch", "canal_x")).toBe("twitch:canal_x");
  });

  it("itens do YouTube ganham id, platform, sourceId e isMature (CA1)", () => {
    const [item] = normalizeLives(
      [{ id: { videoId: "aaaaaaaaaaa" }, snippet: { title: "GTA 6", liveBroadcastContent: "live" } }],
      null,
    );
    expect(item).toMatchObject({
      id: "youtube:aaaaaaaaaaa",
      platform: "youtube",
      sourceId: "aaaaaaaaaaa",
      isMature: false,
    });
    expect(item).not.toHaveProperty("videoId");
  });

  it("dados de demonstração seguem o mesmo modelo (CA1)", () => {
    for (const it of getDemoLives()) {
      expect(it.platform).toBe("youtube");
      expect(it.id).toBe(`youtube:${it.sourceId}`);
      expect(it).not.toHaveProperty("videoId");
      expect(it.isMature).toBe(false);
    }
  });

  it("mesmo sourceId em plataformas diferentes não é deduplicado (CA5)", () => {
    const items = [
      { id: liveId("youtube", "x") },
      { id: liveId("twitch", "x") },
      { id: liveId("youtube", "x") },
    ];
    expect(dedupeById(items).map((i) => i.id)).toEqual(["youtube:x", "twitch:x"]);
  });

  /** Item como era gravado no cache antes da spec 021 (só videoId). */
  const legacy = (videoId: string, rank: number) =>
    ({
      videoId, title: videoId, description: "", channelId: "c", channelTitle: "c", thumbnailUrl: null,
      publishedAt: null, liveStartedAt: null, concurrentViewers: null, language: "unknown",
      watchUrl: "", embedUrl: "", isLive: true, embedAllowed: true, rank,
    }) as unknown as LiveItem;

  it("withIdentity completa itens antigos do cache e não mexe nos novos", () => {
    const old = withIdentity(legacy("aaaaaaaaaaa", 0));
    expect(old).toMatchObject({ id: "youtube:aaaaaaaaaaa", platform: "youtube", sourceId: "aaaaaaaaaaa", isMature: false });
    // Spec 053: o item sai sem `videoId`.
    expect(old).not.toHaveProperty("videoId");
    const [novo] = getDemoLives();
    expect(withIdentity(novo)).toEqual(novo);
  });

  it("spec 053 (CA2): item no formato da Fase 1 (com id e videoId) sai igual, só sem videoId", () => {
    const [novo] = getDemoLives();
    const fase1 = { ...novo, videoId: novo.sourceId };
    const out = withIdentity(fase1);
    expect(out).toEqual(novo);
    expect(out).not.toHaveProperty("videoId");
  });

  it("cache antigo não colapsa a lista em um único item (regressão do deploy da 021)", () => {
    const payload = {
      items: [legacy("aaaaaaaaaaa", 0), legacy("bbbbbbbbbbb", 1), legacy("ccccccccccc", 2)],
      updatedAt: "", cached: true, stale: false, nextPageToken: "N",
    };
    const s = explorerReducer(initialExplorerState, { type: "loaded", payload });
    expect(s.items.map((i) => i.id)).toEqual(["youtube:aaaaaaaaaaa", "youtube:bbbbbbbbbbb", "youtube:ccccccccccc"]);
    const more = explorerReducer(s, { type: "more-loaded", payload: { ...payload, items: [legacy("ddddddddddd", 0)] } });
    expect(more.items).toHaveLength(4);
  });

  it("id do DOM do YouTube é igual ao de antes da Fase 1 (CA3, D3)", () => {
    expect(liveDomId({ platform: "youtube", sourceId: "e2eVideo001" })).toBe("live-e2eVideo001");
  });

  it("id do DOM de outras plataformas é válido e não colide com o YouTube (CA3)", () => {
    const dom = liveDomId({ platform: "kick", sourceId: "canal.com:espaço" });
    expect(dom).toBe("live-kick-canal_com_espa_o");
    expect(dom).toMatch(/^[A-Za-z][A-Za-z0-9_-]*$/);
    expect(liveDomId({ platform: "twitch", sourceId: "abc" })).not.toBe(liveDomId({ platform: "youtube", sourceId: "abc" }));
  });
});
