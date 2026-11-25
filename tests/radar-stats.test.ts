import { describe, expect, it } from "vitest";
import { languageBreakdown, liveCount, topAudience } from "@/lib/lives/radar-stats";
import type { LiveItem } from "@/lib/lives/types";

const item = (videoId: string, extra: Partial<LiveItem> = {}): LiveItem => ({
  id: `youtube:${videoId}`, platform: "youtube", sourceId: videoId,
  videoId, title: videoId, description: "", channelId: "c", channelTitle: `Canal ${videoId}`, thumbnailUrl: null,
  publishedAt: null, liveStartedAt: null, concurrentViewers: null, language: "unknown",
  watchUrl: "", embedUrl: "", isLive: true, embedAllowed: true, isMature: false, rank: 0, ...extra,
});

describe("painel do radar (spec 007 CA5)", () => {
  const items = [
    item("a", { language: "pt", concurrentViewers: 120 }),
    item("b", { language: "pt" }),
    item("c", { language: "en", concurrentViewers: 900 }),
    item("d", { language: "es" }),
    item("e", { language: "en" }),
    item("f", { language: "pt", isLive: false, concurrentViewers: 5000 }),
  ];

  it("conta só lives no ar, por idioma, da maior para a menor", () => {
    expect(liveCount(items)).toBe(5);
    expect(languageBreakdown(items).map((l) => [l.language, l.count])).toEqual([
      ["pt", 2],
      ["en", 2],
      ["es", 1],
    ]);
    expect(languageBreakdown(items)[0].share).toBeCloseTo(0.4);
  });

  it("maior público informado ignora encerradas e não trata ausência como zero", () => {
    expect(topAudience(items)?.videoId).toBe("c");
    expect(topAudience([item("x"), item("y")])).toBeNull();
  });

  it("lista vazia", () => {
    expect(languageBreakdown([])).toEqual([]);
    expect(topAudience([])).toBeNull();
  });
});
