import { platformMeta } from "@/lib/lives/platforms";
import type { LiveItem, LiveStatusPayload } from "@/lib/lives/types";

export type StatusCheck =
  | { status: "pending" }
  | { status: "ok"; data: LiveStatusPayload }
  | { status: "error"; code: string };

export type PlayerView =
  | { kind: "demo" }
  | { kind: "checking" }
  | { kind: "ended" }
  | { kind: "upcoming" }
  | { kind: "unavailable" }
  | { kind: "embed_blocked" }
  /** A plataforma não tem player embutido neste site: só o link (spec 025). */
  | { kind: "link_only" }
  /** unverified: não foi possível confirmar o estado atual (spec 002 D6). */
  | { kind: "consent"; unverified: boolean }
  | { kind: "player"; unverified: boolean };

export function resolvePlayerView(input: {
  demo: boolean;
  /** A plataforma aceita player embutido (PLATFORMS[platform].embed). Padrão: true. */
  platformEmbed?: boolean;
  listEmbedAllowed: boolean | "unknown";
  check: StatusCheck;
  consented: boolean;
}): PlayerView {
  const { demo, listEmbedAllowed, check, consented } = input;
  if (demo) return { kind: "demo" };
  if (input.platformEmbed === false) return { kind: "link_only" };
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

export type PlayerBadge = "demo" | "live" | "ended" | "upcoming" | "unavailable";

/**
 * Selo do cabeçalho do player (spec 018). Usa o estado revalidado quando existe;
 * antes disso (ou se a revalidação falhar), o estado vindo da lista.
 */
export function playerBadge(input: { demo: boolean; listIsLive: boolean; check: StatusCheck }): PlayerBadge {
  const { demo, listIsLive, check } = input;
  if (demo) return "demo";
  if (check.status === "ok") return check.data.state;
  return listIsLive ? "live" : "ended";
}

/**
 * URL do iframe oficial da plataforma do item (spec 025). Null se a plataforma não tem embed.
 * YouTube: igual à de antes (spec 002 D1/D2). `hostname` é exigido pela Twitch (#44).
 */
export function embedSrc(item: Pick<LiveItem, "platform" | "sourceId">, opts: { hostname: string }): string | null {
  const meta = platformMeta(item.platform);
  return meta.embed && meta.embedSrc ? meta.embedSrc(item.sourceId, opts) : null;
}
