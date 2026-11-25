import { describe, expect, it, vi } from "vitest";
import type { LivesProvider } from "@/lib/lives/providers/types";
import { parseProviderList, selectProviders } from "@/lib/lives/providers/select";
import type { Platform } from "@/lib/lives/types";

function provider(platform: Platform, configured = true): LivesProvider {
  return { platform, isConfigured: () => configured, getLives: vi.fn() };
}

describe("LIVES_PROVIDERS: leitura (spec 023)", () => {
  it("CA1: ausente → só youtube", () => {
    expect(parseProviderList(undefined)).toEqual({ platforms: ["youtube"], ignored: 0 });
    expect(parseProviderList(null)).toEqual({ platforms: ["youtube"], ignored: 0 });
  });

  it("CA4: vazio ou só espaços e vírgulas → youtube", () => {
    expect(parseProviderList("")).toEqual({ platforms: ["youtube"], ignored: 0 });
    expect(parseProviderList(" , ,")).toEqual({ platforms: ["youtube"], ignored: 0 });
  });

  it("CA2: valor desconhecido é ignorado e contado", () => {
    expect(parseProviderList("youtube,foo")).toEqual({ platforms: ["youtube"], ignored: 1 });
    expect(parseProviderList("foo,bar")).toEqual({ platforms: ["youtube"], ignored: 2 });
  });

  it("R3 e R7: sem diferenciar maiúsculas, sem repetidos, na ordem dada", () => {
    expect(parseProviderList(" Twitch , youtube,TWITCH ,kick")).toEqual({ platforms: ["twitch", "youtube", "kick"], ignored: 0 });
  });
});

describe("LIVES_PROVIDERS: seleção (spec 023)", () => {
  it("CA3: twitch listada sem implementação fica de fora", () => {
    const yt = provider("youtube");
    const r = selectProviders(["youtube", "twitch"], { youtube: yt });
    expect(r.providers).toEqual([yt]);
    expect(r.disabled).toEqual([{ platform: "twitch", reason: "not_implemented" }]);
  });

  it("CA3: twitch sem credenciais fica de fora", () => {
    const yt = provider("youtube");
    const r = selectProviders(["youtube", "twitch"], { youtube: yt, twitch: provider("twitch", false) });
    expect(r.providers).toEqual([yt]);
    expect(r.disabled).toEqual([{ platform: "twitch", reason: "not_configured" }]);
  });

  it("CA5 / R5: youtube sem chave continua ativo (estado 'busca não configurada')", () => {
    const yt = provider("youtube", false);
    expect(selectProviders(["youtube"], { youtube: yt }).providers).toEqual([yt]);
  });

  it("R5: youtube sem chave + twitch configurada → as duas ativas (resposta parcial)", () => {
    const yt = provider("youtube", false);
    const tw = provider("twitch");
    expect(selectProviders(["youtube", "twitch"], { youtube: yt, twitch: tw }).providers).toEqual([yt, tw]);
  });

  it("CA5 / R6: twitch sozinha sem credenciais volta para o youtube", () => {
    const yt = provider("youtube");
    const r = selectProviders(["twitch"], { youtube: yt, twitch: provider("twitch", false) });
    expect(r.providers).toEqual([yt]);
    expect(r.disabled).toEqual([{ platform: "twitch", reason: "not_configured" }]);
  });

  it("R7: a ordem da lista define a ordem dos provedores", () => {
    const yt = provider("youtube");
    const tw = provider("twitch");
    expect(selectProviders(["twitch", "youtube"], { youtube: yt, twitch: tw }).providers).toEqual([tw, yt]);
  });
});
