import { describe, expect, it } from "vitest";
import { embedSrc, playerBadge, resolvePlayerView, type StatusCheck } from "@/lib/lives/player-state";
import type { LiveStatusPayload } from "@/lib/lives/types";

const ok = (p: Partial<LiveStatusPayload>): StatusCheck => ({
  status: "ok",
  data: { platform: "youtube", sourceId: "x", state: "live", embedAllowed: true, concurrentViewers: null, checkedAt: "", cached: false, ...p },
});
const base = { demo: false, listEmbedAllowed: true as boolean | "unknown", consented: false };

describe("resolvePlayerView", () => {
  it("simulado nunca carrega player", () => {
    expect(resolvePlayerView({ ...base, demo: true, check: ok({}), consented: true })).toEqual({ kind: "demo" });
  });
  it("verificando enquanto a revalidação não volta", () => {
    expect(resolvePlayerView({ ...base, check: { status: "pending" } })).toEqual({ kind: "checking" });
  });
  it("live confirmada pede consentimento antes do iframe (CA1)", () => {
    expect(resolvePlayerView({ ...base, check: ok({}) })).toEqual({ kind: "consent", unverified: false });
    expect(resolvePlayerView({ ...base, check: ok({}), consented: true })).toEqual({ kind: "player", unverified: false });
  });
  it("encerrada, agendada e indisponível não carregam player", () => {
    expect(resolvePlayerView({ ...base, check: ok({ state: "ended" }), consented: true }).kind).toBe("ended");
    expect(resolvePlayerView({ ...base, check: ok({ state: "upcoming" }), consented: true }).kind).toBe("upcoming");
    expect(resolvePlayerView({ ...base, check: ok({ state: "unavailable" }), consented: true }).kind).toBe("unavailable");
  });
  it("embed desativado na lista ou na revalidação vira fallback (CA7)", () => {
    expect(resolvePlayerView({ ...base, listEmbedAllowed: false, check: { status: "pending" } }).kind).toBe("embed_blocked");
    expect(resolvePlayerView({ ...base, check: ok({ embedAllowed: false }), consented: true }).kind).toBe("embed_blocked");
  });
  it("falha na revalidação não bloqueia: consentimento/player não verificados (CA6)", () => {
    const check: StatusCheck = { status: "error", code: "quota_exceeded" };
    expect(resolvePlayerView({ ...base, check })).toEqual({ kind: "consent", unverified: true });
    expect(resolvePlayerView({ ...base, check, consented: true })).toEqual({ kind: "player", unverified: true });
  });
});

describe("embedSrc (CA2)", () => {
  it("usa a URL oficial sem autoplay", () => {
    const src = embedSrc({ platform: "youtube", sourceId: "aaaaaaaaaaa" }, { hostname: "radardelives.darioreis.dev" });
    expect(src?.startsWith("https://www.youtube.com/embed/aaaaaaaaaaa?")).toBe(true);
    expect(src).not.toContain("autoplay");
  });
  it("YouTube: URL idêntica à de antes da spec 025, qualquer que seja o hostname (CA1)", () => {
    for (const hostname of ["radardelives.darioreis.dev", "localhost"]) {
      expect(embedSrc({ platform: "youtube", sourceId: "aaaaaaaaaaa" }, { hostname })).toBe(
        "https://www.youtube.com/embed/aaaaaaaaaaa?playsinline=1&rel=0",
      );
    }
  });
  it("plataforma sem embed não tem URL de iframe (spec 025)", () => {
    expect(embedSrc({ platform: "kick", sourceId: "canal" }, { hostname: "x" })).toBeNull();
  });
  it("Twitch: player oficial com channel, parent do domínio, sem autoplay e sem som (spec 032 CA1)", () => {
    expect(embedSrc({ platform: "twitch", sourceId: "canal_x" }, { hostname: "radardelives.darioreis.dev" })).toBe(
      "https://player.twitch.tv/?channel=canal_x&parent=radardelives.darioreis.dev&autoplay=false&muted=true",
    );
    // parent segue o domínio atual (Preview, localhost).
    expect(embedSrc({ platform: "twitch", sourceId: "canal_x" }, { hostname: "localhost" })).toContain("parent=localhost");
  });
});

describe("tela estreita para o player (spec 032 D3, CA4)", () => {
  it("sem largura mínima, troca consentimento e player por too_small", () => {
    expect(resolvePlayerView({ ...base, fitsPlayer: false, check: ok({}) })).toEqual({ kind: "too_small" });
    expect(resolvePlayerView({ ...base, fitsPlayer: false, check: ok({}), consented: true })).toEqual({ kind: "too_small" });
    expect(resolvePlayerView({ ...base, fitsPlayer: false, check: { status: "error", code: "network" } })).toEqual({ kind: "too_small" });
  });
  it("estados da live têm prioridade sobre a tela estreita", () => {
    expect(resolvePlayerView({ ...base, fitsPlayer: false, check: ok({ state: "ended" }) }).kind).toBe("ended");
    expect(resolvePlayerView({ ...base, fitsPlayer: false, check: { status: "pending" } }).kind).toBe("checking");
    expect(resolvePlayerView({ ...base, demo: true, fitsPlayer: false, check: ok({}) }).kind).toBe("demo");
  });
  it("com largura suficiente (ou sem mínimo), o fluxo é o de sempre", () => {
    expect(resolvePlayerView({ ...base, fitsPlayer: true, check: ok({}), consented: true })).toEqual({ kind: "player", unverified: false });
  });
});

describe("modo só-link (spec 025 CA3)", () => {
  it("plataforma sem embed abre só o link, em qualquer estado da revalidação", () => {
    for (const check of [{ status: "pending" } as const, ok({}), ok({ state: "ended" }), { status: "error", code: "network" } as const]) {
      expect(resolvePlayerView({ ...base, platformEmbed: false, check, consented: true })).toEqual({ kind: "link_only" });
    }
  });
  it("simulado continua tendo prioridade", () => {
    expect(resolvePlayerView({ ...base, demo: true, platformEmbed: false, check: ok({}) })).toEqual({ kind: "demo" });
  });
  it("sem platformEmbed (padrão) o comportamento é o de antes", () => {
    expect(resolvePlayerView({ ...base, check: ok({}), consented: true })).toEqual({ kind: "player", unverified: false });
  });
});

describe("playerBadge (spec 018)", () => {
  it("segue o estado revalidado: agendada e indisponível não viram 'encerrada'", () => {
    expect(playerBadge({ demo: false, listIsLive: true, check: ok({ state: "live" }) })).toBe("live");
    expect(playerBadge({ demo: false, listIsLive: true, check: ok({ state: "ended" }) })).toBe("ended");
    expect(playerBadge({ demo: false, listIsLive: true, check: ok({ state: "upcoming" }) })).toBe("upcoming");
    expect(playerBadge({ demo: false, listIsLive: true, check: ok({ state: "unavailable" }) })).toBe("unavailable");
  });
  it("sem revalidação, usa o estado da lista", () => {
    expect(playerBadge({ demo: false, listIsLive: true, check: { status: "pending" } })).toBe("live");
    expect(playerBadge({ demo: false, listIsLive: false, check: { status: "error", code: "network" } })).toBe("ended");
  });
  it("simulado tem selo próprio", () => {
    expect(playerBadge({ demo: true, listIsLive: true, check: ok({ state: "ended" }) })).toBe("demo");
  });
});
