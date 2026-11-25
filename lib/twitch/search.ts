import "server-only";
import type { LiveItem } from "@/lib/lives/types";
import { logEvent, type Logger } from "@/lib/telemetry";
import type { TwitchClient } from "./client";
import { isAdult, normalizeStream } from "./normalize";
import { TwitchChannelsSchema, TwitchStreamSchema, TwitchStreamsPageSchema, type TwitchStream } from "./types";

export interface TwitchSearchOptions {
  gameId: string;
  /** Idiomas pedidos à API (PRD D7). */
  languages?: readonly string[];
  /** Máximo de páginas de 100 (spec 028 D2). */
  maxPages?: number;
  log?: Logger;
}

const CHANNELS_BATCH = 100;

/**
 * Busca lives de GTA 6 na Twitch e devolve LiveItem[] (spec 028).
 * Ordem da API (por espectadores), sem duplicatas, com o selo adulto por /helix/channels.
 */
export async function searchTwitchLives(client: TwitchClient, opts: TwitchSearchOptions): Promise<LiveItem[]> {
  const log = opts.log ?? logEvent;
  const languages = opts.languages ?? ["pt", "en", "es"];
  const maxPages = opts.maxPages ?? 3;

  const streams: TwitchStream[] = [];
  const seen = new Set<string>();
  let invalid = 0;
  let cursor: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    let res;
    try {
      res = await client.helix(
        "streams",
        { game_id: opts.gameId, language: languages, type: "live", first: "100", ...(cursor ? { after: cursor } : {}) },
        TwitchStreamsPageSchema,
      );
    } catch (e) {
      // 1ª página: o erro sobe; seguintes: ficam as páginas já obtidas (D5).
      if (page === 0) throw e;
      log("twitch_error", { stage: "streams_page", page });
      break;
    }
    for (const raw of res.data) {
      const parsed = TwitchStreamSchema.safeParse(raw);
      if (!parsed.success) {
        invalid++;
        continue;
      }
      // A Twitch avisa que há duplicatas entre páginas (spec 019).
      if (seen.has(parsed.data.id)) continue;
      seen.add(parsed.data.id);
      streams.push(parsed.data);
    }
    cursor = res.pagination?.cursor;
    if (!cursor || res.data.length === 0) break;
  }
  if (invalid > 0) log("twitch_error", { stage: "normalize", code: "invalid_item", count: invalid });

  const mature = await matureBroadcasters(client, streams, log);
  return streams.map((s, rank) => normalizeStream(s, rank, mature.has(s.user_id)));
}

/** Ids de canais com rótulo adulto (D1). Falha → conjunto vazio, com log (D4). */
async function matureBroadcasters(client: TwitchClient, streams: readonly TwitchStream[], log: Logger): Promise<Set<string>> {
  const ids = [...new Set(streams.map((s) => s.user_id))];
  const mature = new Set<string>();
  for (let i = 0; i < ids.length; i += CHANNELS_BATCH) {
    try {
      const res = await client.helix("channels", { broadcaster_id: ids.slice(i, i + CHANNELS_BATCH) }, TwitchChannelsSchema);
      for (const c of res.data) if (isAdult(c.content_classification_labels)) mature.add(c.broadcaster_id);
    } catch {
      log("twitch_error", { stage: "channels" });
    }
  }
  return mature;
}
