import type { VideoStatusPayload } from "@/lib/youtube/types";

export type StatusCheck =
  | { status: "pending" }
  | { status: "ok"; data: VideoStatusPayload }
  | { status: "error"; code: string };

export type PlayerView =
  | { kind: "demo" }
  | { kind: "checking" }
  | { kind: "ended" }
  | { kind: "upcoming" }
  | { kind: "unavailable" }
  | { kind: "embed_blocked" }
  /** unverified: não foi possível confirmar o estado atual (spec 002 D6). */
  | { kind: "consent"; unverified: boolean }
  | { kind: "player"; unverified: boolean };

export function resolvePlayerView(input: {
  demo: boolean;
  listEmbedAllowed: boolean | "unknown";
  check: StatusCheck;
  consented: boolean;
}): PlayerView {
  const { demo, listEmbedAllowed, check, consented } = input;
  if (demo) return { kind: "demo" };
  if (listEmbedAllowed === false) return { kind: "embed_blocked" };
  if (check.status === "pending") return { kind: "checking" };
  if (check.status === "error") return consented ? { kind: "player", unverified: true } : { kind: "consent", unverified: true };

  const { state, embedAllowed } = check.data;
  if (state === "ended") return { kind: "ended" };
  if (state === "upcoming") return { kind: "upcoming" };
  if (state === "unavailable") return { kind: "unavailable" };
  if (embedAllowed === false) return { kind: "embed_blocked" };
  return consented ? { kind: "player", unverified: false } : { kind: "consent", unverified: false };
}

/** URL oficial do player (player_parameters), sem autoplay (spec 002 D1/D2). */
export function embedSrc(videoId: string): string {
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?playsinline=1&rel=0`;
}
