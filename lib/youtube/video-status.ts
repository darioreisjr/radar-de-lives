import type { CacheStore } from "@/lib/cache/types";
import { logEvent, type Logger } from "@/lib/telemetry";
import type { YoutubeClient } from "./client";
import { createDailyBudget } from "./daily-budget";
import { LivesError } from "./errors";
import { parseViewers } from "./normalize";
import type { VideoLiveState, VideoStatusPayload, YtVideoItem } from "./types";

type StatusData = Omit<VideoStatusPayload, "checkedAt" | "cached">;

/** Estado atual de um vídeo a partir de videos.list (002 RF3). */
export function videoStatusFrom(videoId: string, item: YtVideoItem | undefined): StatusData {
  if (!item) return { videoId, state: "unavailable", embedAllowed: "unknown", concurrentViewers: null };
  const content = item.snippet?.liveBroadcastContent;
  let state: VideoLiveState;
  if (item.liveStreamingDetails?.actualEndTime || content === "none") state = "ended";
  else if (content === "upcoming") state = "upcoming";
  else state = "live";
  const embeddable = item.status?.embeddable;
  return {
    videoId,
    state,
    embedAllowed: typeof embeddable === "boolean" ? embeddable : "unknown",
    // Contagem só faz sentido enquanto está ao vivo; ausente => null.
    concurrentViewers: state === "live" ? parseViewers(item.liveStreamingDetails?.concurrentViewers) : null,
  };
}

export interface VideoStatusDeps {
  client: YoutubeClient | null;
  cache: CacheStore<StatusData>;
  ttlMs: number;
  dailyBudget: number;
  now?: () => number;
  log?: Logger;
}

export function createVideoStatusService(deps: VideoStatusDeps) {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? logEvent;
  const budget = createDailyBudget(deps.dailyBudget, now);
  const inflight = new Map<string, Promise<VideoStatusPayload>>();

  async function getStatus(videoId: string): Promise<VideoStatusPayload> {
    const client = deps.client;
    if (!client) throw new LivesError("missing_api_key");

    const hit = await deps.cache.get(videoId);
    if (hit && now() - hit.storedAt < deps.ttlMs) {
      return { ...hit.value, checkedAt: new Date(hit.storedAt).toISOString(), cached: true };
    }
    const running = inflight.get(videoId);
    if (running) return running;

    if (!budget.consume()) {
      log("budget_exhausted", { method: "videos.list", budgetLimit: deps.dailyBudget });
      throw new LivesError("quota_exceeded");
    }

    const task = (async () => {
      try {
        const res = await client.videoDetails([videoId]);
        log("youtube_call", { method: "videos.list", ids: 1, budgetUsed: budget.used(), budgetLimit: deps.dailyBudget });
        const value = videoStatusFrom(videoId, res.items?.find((i) => i.id === videoId));
        const storedAt = now();
        await deps.cache.set(videoId, { value, storedAt }, deps.ttlMs);
        return { ...value, checkedAt: new Date(storedAt).toISOString(), cached: false };
      } catch (e) {
        const err = e instanceof LivesError ? e : new LivesError("upstream_unavailable");
        log("youtube_error", { method: "videos.list", code: err.code });
        throw err;
      } finally {
        inflight.delete(videoId);
      }
    })();
    inflight.set(videoId, task);
    return task;
  }

  return { getStatus, budgetUsed: budget.used };
}

export type VideoStatusService = ReturnType<typeof createVideoStatusService>;
