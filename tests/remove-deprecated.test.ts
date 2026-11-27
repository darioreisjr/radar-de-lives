/**
 * Spec 053: `videoId`, a rota /api/lives/[videoId] e `source` saíram do payload público.
 * O cache de produção ainda pode ter itens e status gravados no formato anterior.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { MemoryCache } from "@/lib/cache/memory-cache";
import { getDemoLives } from "@/lib/fixtures/lives";
import { createLivesAggregator } from "@/lib/lives/aggregator";
import { explorerReducer, initialExplorerState } from "@/lib/lives/explorer-state";
import { createTwitchProvider } from "@/lib/lives/providers/twitch";
import { createYoutubeProvider } from "@/lib/lives/providers/youtube";
import type { LiveItem } from "@/lib/lives/types";
import type { TwitchClient } from "@/lib/twitch/client";
import type { TwitchLivesService } from "@/lib/twitch/service";
import { createTwitchStatusService, type TwitchStatusData } from "@/lib/twitch/status";
import type { LivesService } from "@/lib/youtube/service";

const T0 = Date.parse("2026-11-27T12:00:00Z");

/** Item como gravado no cache antes da spec 021: só `videoId`. */
const preFase1 = (id: string, rank: number) =>
  ({
    videoId: id, title: id, description: "", channelId: "c", channelTitle: "c", thumbnailUrl: null,
    publishedAt: null, liveStartedAt: null, concurrentViewers: null, language: "unknown",
    watchUrl: "", embedUrl: "", isLive: true, embedAllowed: true, rank,
  }) as unknown as LiveItem;

/** Item como gravado entre as specs 021 e 053: completo e com `videoId`. */
const fase1 = (item: LiveItem) => ({ ...item, videoId: item.sourceId }) as LiveItem;

const page = (items: LiveItem[]) => ({ items, updatedAt: new Date(T0).toISOString(), cached: true, stale: false, nextPageToken: null });

describe("cache em formatos antigos (spec 053 CA2)", () => {
  it("YouTube: itens antigos e da Fase 1 saem com id e sem videoId, pelo agregador", async () => {
    const [a, b] = getDemoLives();
    const service = { getLives: vi.fn(async () => page([preFase1("aaaaaaaaaaa", 0), fase1(a), fase1(b)])) };
    const yt = createYoutubeProvider(service as unknown as LivesService, true);
    const r = await createLivesAggregator({ providers: [yt], log: () => {} }).getLives();
    expect(r.items.map((i) => i.id)).toEqual(["youtube:aaaaaaaaaaa", a.id, b.id]);
    for (const it of r.items) expect(it).not.toHaveProperty("videoId");
  });

  it("Twitch: itens gravados com videoId saem sem ele", async () => {
    const [a] = getDemoLives();
    const tw = { ...a, id: "twitch:canal", platform: "twitch" as const, sourceId: "canal" };
    const service = { getLives: vi.fn(async () => page([fase1(tw)])) };
    const r = await createTwitchProvider(service as unknown as TwitchLivesService).getLives({});
    expect(r.items[0]).toEqual(tw);
    expect(r.items[0]).not.toHaveProperty("videoId");
  });

  it("Twitch: status gravado com videoId (cache de 60 s) sai sem ele", async () => {
    const cache = new MemoryCache<TwitchStatusData>(5, () => T0);
    const antigo = { platform: "twitch", sourceId: "canal", videoId: "canal", state: "live", embedAllowed: true, concurrentViewers: 5 };
    await cache.set("canal", { value: antigo as TwitchStatusData, storedAt: T0 }, 60_000);
    const helix = vi.fn();
    const service = createTwitchStatusService({
      client: { helix } as unknown as TwitchClient,
      cache,
      ttlMs: 60_000,
      now: () => T0,
      log: () => {},
    });
    const r = await service.getStatus("canal");
    expect(helix).not.toHaveBeenCalled();
    expect(r).toMatchObject({ platform: "twitch", sourceId: "canal", state: "live", cached: true });
    expect(r).not.toHaveProperty("videoId");
  });
});

describe("payload e dados simulados (spec 053 CA1, CA3)", () => {
  it("fixtures de desenvolvimento sem videoId", () => {
    for (const it of getDemoLives()) expect(it).not.toHaveProperty("videoId");
  });

  it("dados simulados continuam marcados por demo; dados reais não", () => {
    const base = { items: getDemoLives(), updatedAt: "", cached: false, stale: false, nextPageToken: null };
    const demo = explorerReducer(initialExplorerState, { type: "loaded", payload: { ...base, demo: true } });
    expect(demo.meta?.demo).toBe(true);
    const real = explorerReducer(initialExplorerState, { type: "loaded", payload: base });
    expect(real.meta?.demo).toBeUndefined();
    expect(real.meta).not.toHaveProperty("source");
  });

  it("a rota antiga /api/lives/[videoId] não existe mais (CA4)", () => {
    expect(fs.existsSync(path.join(process.cwd(), "app", "api", "lives", "[videoId]"))).toBe(false);
  });
});
