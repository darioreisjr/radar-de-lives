import { z } from "zod";
import type { LiveStatusPayload } from "@/lib/lives/types";
import type { CacheStore } from "@/lib/store/types";
import { logEvent, type Logger } from "@/lib/telemetry";
import { LivesError } from "@/lib/youtube/errors";
import type { KickClient } from "./client";
import { kickViewers } from "./normalize";

/** Slug de canal da Kick: a API aceita até 25 caracteres por slug (spec 049 D4). */
export const KICK_SLUG = /^[A-Za-z0-9_-]{1,25}$/;

export type KickStatusData = Omit<LiveStatusPayload, "checkedAt" | "cached">;

/**
 * GET /public/v1/channels: só o necessário (D2). O Zod descarta o resto da resposta,
 * inclusive `stream.key` e `stream.url` (chave e endereço de transmissão do streamer).
 */
const ChannelsSchema = z.object({
  data: z.array(
    z.object({
      slug: z.string().optional(),
      stream: z
        .object({ is_live: z.boolean().optional(), viewer_count: z.unknown().optional() })
        .nullable()
        .optional(),
    }),
  ),
});

export interface KickStatusDeps {
  client: KickClient;
  cache: CacheStore<KickStatusData>;
  ttlMs: number;
  now?: () => number;
  log?: Logger;
}

/** Revalidação de uma live da Kick pelo slug do canal (spec 049). */
export function createKickStatusService(deps: KickStatusDeps) {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? logEvent;
  const inflight = new Map<string, Promise<LiveStatusPayload>>();

  async function store<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch {
      log("store_error", { operation, platform: "kick" });
      throw new LivesError("upstream_unavailable");
    }
  }

  async function getStatus(id: string): Promise<LiveStatusPayload> {
    const slug = id.toLowerCase();
    const hit = await store("cache.get", () => deps.cache.get(slug));
    if (hit && now() - hit.storedAt < deps.ttlMs) {
      return { ...hit.value, checkedAt: new Date(hit.storedAt).toISOString(), cached: true };
    }
    const running = inflight.get(slug);
    if (running) return running;

    const task = (async (): Promise<LiveStatusPayload> => {
      try {
        const res = await deps.client.api("v1/channels", { slug }, ChannelsSchema);
        const channel = res.data.find((c) => c.slug?.toLowerCase() === slug) ?? res.data[0];
        const live = channel?.stream?.is_live === true;
        // D3: sem canal → indisponível; canal sem stream ao vivo → encerrada.
        const value: KickStatusData = {
          platform: "kick",
          sourceId: slug,
          state: !channel ? "unavailable" : live ? "live" : "ended",
          embedAllowed: true,
          concurrentViewers: live ? kickViewers(channel.stream?.viewer_count) : null,
        };
        const storedAt = now();
        try {
          await deps.cache.set(slug, { value, storedAt }, deps.ttlMs);
        } catch {
          log("store_error", { operation: "cache.set", platform: "kick" });
        }
        return { ...value, checkedAt: new Date(storedAt).toISOString(), cached: false };
      } finally {
        inflight.delete(slug);
      }
    })();
    inflight.set(slug, task);
    return task;
  }

  return { getStatus };
}

export type KickStatusService = ReturnType<typeof createKickStatusService>;
