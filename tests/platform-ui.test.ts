import { describe, expect, it } from "vitest";
import { applyLiveFilters } from "@/lib/lives/filter";
import { liveId } from "@/lib/lives/identity";
import { PLATFORMS } from "@/lib/lives/platforms";
import { platformBreakdown } from "@/lib/lives/radar-stats";
import { activePlatforms, hasPartialFailure, isMultiPlatform } from "@/lib/lives/sources";
import type { LiveItem, Platform, SourceStatus } from "@/lib/lives/types";

const item = (platform: Platform, id: string, extra: Partial<LiveItem> = {}): LiveItem => ({
  id: liveId(platform, id), platform, sourceId: id,
  title: `Live ${id}`, description: "", channelId: "c", channelTitle: "c", thumbnailUrl: null,
  publishedAt: null, liveStartedAt: null, concurrentViewers: null, language: "pt",
  watchUrl: "", embedUrl: "", isLive: true, embedAllowed: true, isMature: false, rank: 0, ...extra,
});
const src = (platform: Platform, ok = true): SourceStatus => ({
  platform, ok, cached: false, stale: false, updatedAt: ok ? "2026-11-25T12:00:00.000Z" : null,
});

describe("plataformas ativas (spec 026 D1, D2)", () => {
  it("sem sources vale só o YouTube", () => {
    expect(activePlatforms(undefined)).toEqual(["youtube"]);
    expect(activePlatforms([])).toEqual(["youtube"]);
    expect(isMultiPlatform(undefined)).toBe(false);
  });
  it("fonte que falhou continua ativa", () => {
    const s = [src("youtube"), src("twitch", false)];
    expect(activePlatforms(s)).toEqual(["youtube", "twitch"]);
    expect(isMultiPlatform(s)).toBe(true);
  });
  it("uma plataforma só não é multiplataforma", () => {
    expect(isMultiPlatform([src("youtube")])).toBe(false);
  });
});

describe("resultado parcial (spec 026 CA4)", () => {
  it("parcial só quando uma falha e outra responde", () => {
    expect(hasPartialFailure([src("youtube"), src("twitch", false)])).toBe(true);
    expect(hasPartialFailure([src("youtube"), src("twitch")])).toBe(false);
    expect(hasPartialFailure([src("youtube", false)])).toBe(false);
    expect(hasPartialFailure(undefined)).toBe(false);
  });
});

describe("filtro por plataforma (spec 026 CA3)", () => {
  const items = [
    item("youtube", "y1", { rank: 0, language: "pt", concurrentViewers: 10 }),
    item("twitch", "t1", { rank: 1, language: "en", concurrentViewers: 50 }),
    item("twitch", "t2", { rank: 2, language: "pt", concurrentViewers: 30, title: "GTA 6 missão" }),
  ];
  it("sem platform ou com 'all' não filtra", () => {
    expect(applyLiveFilters(items, { lang: "all", sort: "relevance" })).toHaveLength(3);
    expect(applyLiveFilters(items, { lang: "all", sort: "relevance", platform: "all" })).toHaveLength(3);
  });
  it("combina com idioma, busca e ordenação", () => {
    expect(applyLiveFilters(items, { lang: "all", sort: "viewers", platform: "twitch" }).map((i) => i.id)).toEqual(["twitch:t1", "twitch:t2"]);
    expect(applyLiveFilters(items, { lang: "pt", sort: "relevance", platform: "twitch" }).map((i) => i.id)).toEqual(["twitch:t2"]);
    expect(applyLiveFilters(items, { q: "missao", lang: "all", sort: "relevance", platform: "twitch" }).map((i) => i.id)).toEqual(["twitch:t2"]);
    expect(applyLiveFilters(items, { lang: "en", sort: "relevance", platform: "youtube" })).toEqual([]);
  });
});

describe("contagem por plataforma no radar (spec 026)", () => {
  it("conta só lives no ar, na ordem das plataformas ativas, incluindo zero", () => {
    const items = [item("youtube", "a"), item("twitch", "b"), item("twitch", "c", { isLive: false })];
    expect(platformBreakdown(items, ["youtube", "twitch", "kick"])).toEqual([
      { platform: "youtube", count: 1 },
      { platform: "twitch", count: 1 },
      { platform: "kick", count: 0 },
    ]);
  });
});

describe("aviso de login no player (spec 044)", () => {
  it("só a Twitch tem o aviso, e ele aponta para o link da plataforma", () => {
    expect(PLATFORMS.youtube.loginNotice).toBeUndefined();
    expect(PLATFORMS.kick.loginNotice).toBeUndefined();
    const n = PLATFORMS.twitch.loginNotice!;
    expect(n.beforeLoad).toContain("entre na sua conta");
    expect(n.beforeLoad).toContain("“Abrir na Twitch”");
    expect(n.withPlayer).toBe("Se a Twitch pedir login ou o player não carregar, abra na Twitch.");
  });
});
