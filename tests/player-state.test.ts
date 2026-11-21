import { describe, expect, it } from "vitest";
import { embedSrc, resolvePlayerView, type StatusCheck } from "@/lib/lives/player-state";
import type { VideoStatusPayload } from "@/lib/youtube/types";

const ok = (p: Partial<VideoStatusPayload>): StatusCheck => ({
  status: "ok",
  data: { videoId: "x", state: "live", embedAllowed: true, concurrentViewers: null, checkedAt: "", cached: false, ...p },
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
    const src = embedSrc("aaaaaaaaaaa");
    expect(src.startsWith("https://www.youtube.com/embed/aaaaaaaaaaa?")).toBe(true);
    expect(src).not.toContain("autoplay");
  });
});
