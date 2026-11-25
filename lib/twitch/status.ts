import { z } from "zod";
import type { LiveStatusPayload } from "@/lib/lives/types";
import type { CacheStore } from "@/lib/store/types";
import { logEvent, type Logger } from "@/lib/telemetry";
import { LivesError } from "@/lib/youtube/errors";
import type { TwitchClient } from "./client";
import { twitchViewers } from "./normalize";

/** Login de canal da Twitch (spec 030 D1). */
export const TWITCH_LOGIN = /^[A-Za-z0-9_]{1,25}$/;

export type TwitchStatusData = Omit<LiveStatusPayload, "checkedAt" | "cached">;

const StatusSchema = z.object({
  data: z.array(z.object({ type: z.string().optional(), viewer_count: z.unknown().optional() })),
});

export interface TwitchStatusDeps {
  client: TwitchClient;
  cache: CacheStore<TwitchStatusData>;
  ttlMs: number;
  now?: () => number;
  log?: Logger;
}

/** Revalidação de uma live da Twitch (spec 030): lista vazia = encerrada. */
export function createTwitchStatusService(deps: TwitchStatusDeps) {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? logEvent;
  const inflight = new Map<string, Promise<LiveStatusPayload>>();

  async function store<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch {
      log("store_error", { operation, platform: "twitch" });
      throw new LivesError("upstream_unavailable");
    }
  }

  async function getStatus(id: string): Promise<LiveStatusPayload> {
    const login = id.toLowerCase();
    const hit = await store("cache.get", () => deps.cache.get(login));
    if (hit && now() - hit.storedAt < deps.ttlMs) {
      return { ...hit.value, checkedAt: new Date(hit.storedAt).toISOString(), cached: true };
    }
    const running = inflight.get(login);
    if (running) return running;

    const task = (async (): Promise<LiveStatusPayload> => {
      try {
        const res = await deps.client.helix("streams", { user_login: login, type: "live" }, StatusSchema);
        const live = res.data.find((s) => (s.type ?? "live") === "live");
        const value: TwitchStatusData = {
          platform: "twitch",
          sourceId: login,
          videoId: login,
          state: live ? "live" : "ended",
          embedAllowed: true,
          concurrentViewers: live ? twitchViewers(live.viewer_count) : null,
        };
        const storedAt = now();
        try {
          await deps.cache.set(login, { value, storedAt }, deps.ttlMs);
        } catch {
          log("store_error", { operation: "cache.set", platform: "twitch" });
        }
        return { ...value, checkedAt: new Date(storedAt).toISOString(), cached: false };
      } finally {
        inflight.delete(login);
      }
    })();
    inflight.set(login, task);
    return task;
  }

  return { getStatus };
}

export type TwitchStatusService = ReturnType<typeof createTwitchStatusService>;
