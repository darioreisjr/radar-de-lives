import { describe, expect, it, vi } from "vitest";
import { MemoryCache } from "@/lib/cache/memory-cache";
import type { TelemetryEvent, TelemetryFields } from "@/lib/telemetry";
import { createYoutubeClient } from "@/lib/youtube/client";
import { createLivesService, type PageData } from "@/lib/youtube/service";

const KEY = "TEST_KEY_telemetry_should_not_leak";
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("telemetria (CA6)", () => {
  it("registra chamadas, erro e stale sem expor a chave", async () => {
    let fail = false;
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      if (fail) return json(403, { error: { message: `bad ${KEY}`, errors: [{ reason: "quotaExceeded" }] } });
      return String(input).includes("/search?")
        ? json(200, { items: [{ id: { videoId: "aaaaaaaaaaa" }, snippet: { liveBroadcastContent: "live" } }] })
        : json(200, { items: [{ id: "aaaaaaaaaaa", snippet: { liveBroadcastContent: "live" } }] });
    }) as unknown as typeof fetch;

    const events: { evt: TelemetryEvent; fields?: TelemetryFields }[] = [];
    let t = Date.parse("2026-11-21T12:00:00Z");
    const now = () => t;
    const service = createLivesService({
      client: createYoutubeClient({ apiKey: KEY, regionCode: "BR", relevanceLanguage: "pt", fetchImpl, retryDelayMs: 0 }),
      cache: new MemoryCache<PageData>(50, now),
      config: { query: "q", ttlMs: 900_000, staleMs: 600_000, minUpstreamIntervalMs: 30_000, dailySearchBudget: 90 },
      now,
      log: (evt, fields) => events.push({ evt, fields }),
    });

    await service.getLives();
    fail = true;
    t += 1_000_000;
    const r = await service.getLives();
    expect(r.stale).toBe(true);

    expect(events.map((e) => e.evt)).toEqual(["youtube_call", "youtube_call", "youtube_error", "stale_served"]);
    expect(events[0].fields).toMatchObject({ method: "search.list", budgetUsed: 1, budgetLimit: 90 });
    expect(events[2].fields).toMatchObject({ code: "quota_exceeded" });
    expect(JSON.stringify(events)).not.toContain(KEY);
    expect(JSON.stringify(events)).not.toContain("googleapis");
  });
});
