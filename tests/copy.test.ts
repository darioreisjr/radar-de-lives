import { afterEach, describe, expect, it, vi } from "vitest";
import { getActivePlatforms } from "@/lib/lives/active-platforms";
import {
  coverageNote,
  formatPlatformList,
  heroLead,
  searchSubject,
  siteDescription,
  thumbnailsSource,
  watchElsewhere,
} from "@/lib/lives/copy";

describe("lista de plataformas em pt-BR (spec 034)", () => {
  it("uma, duas e três plataformas, com gênero certo", () => {
    expect(formatPlatformList(["youtube"])).toBe("no YouTube");
    expect(formatPlatformList(["youtube", "twitch"])).toBe("no YouTube e na Twitch");
    expect(formatPlatformList(["youtube", "twitch", "kick"])).toBe("no YouTube, na Twitch e na Kick");
    expect(formatPlatformList(["youtube", "twitch"], "ofLabel")).toBe("do YouTube e da Twitch");
    expect(formatPlatformList(["twitch"], "label")).toBe("Twitch");
    expect(formatPlatformList([])).toBe("no YouTube");
  });
});

describe("textos com só o YouTube são idênticos aos de antes (CA1)", () => {
  const yt = ["youtube"] as const;
  it("descrição, cobertura, hero e radar", () => {
    expect(siteDescription(yt)).toBe("Encontre transmissões públicas de GTA 6 ao vivo no YouTube.");
    expect(coverageNote(yt)).toBe(
      "Mostramos lives encontradas pela busca pública da YouTube Data API. A busca depende de títulos, idioma e região, e não garante cobertura completa.",
    );
    expect(`${heroLead(yt)}. Filtre por idioma, ordene por público e assista aqui ou ${watchElsewhere(yt)}.`).toBe(
      "Transmissões públicas encontradas no YouTube, reunidas em um só lugar. Filtre por idioma, ordene por público e assista aqui ou no YouTube.",
    );
    expect(thumbnailsSource(yt)).toBe("do YouTube");
    expect(searchSubject(yt)).toBe("a consulta ao YouTube");
  });
});

describe("textos com YouTube e Twitch (CA2)", () => {
  const both = ["youtube", "twitch"] as const;
  it("citam as duas plataformas", () => {
    expect(siteDescription(both)).toBe("Encontre transmissões públicas de GTA 6 ao vivo no YouTube e na Twitch.");
    expect(coverageNote(both)).toBe(
      "Mostramos lives encontradas pelas buscas públicas da YouTube Data API e da API da Twitch. As buscas dependem de títulos, categoria, idioma e região, e não garantem cobertura completa.",
    );
    expect(heroLead(both)).toBe("Transmissões públicas encontradas no YouTube e na Twitch, reunidas em um só lugar");
    expect(watchElsewhere(both)).toBe("na plataforma de origem");
    expect(thumbnailsSource(both)).toBe("do YouTube e da Twitch");
    expect(searchSubject(both)).toBe("a busca");
  });

  it("CA3: nunca prometem todas as lives (PRD D9)", () => {
    for (const p of [["youtube"], ["youtube", "twitch"]] as const) {
      for (const t of [siteDescription(p), coverageNote(p), heroLead(p)]) expect(t.toLowerCase()).not.toMatch(/\btodas\b/);
      expect(coverageNote(p)).toContain("lives encontradas");
    }
  });
});

describe("plataformas ativas no servidor (spec 034, mesma regra da spec 023)", () => {
  afterEach(() => vi.unstubAllEnvs());
  const env = (providers: string, creds: boolean) => {
    vi.stubEnv("LIVES_PROVIDERS", providers);
    vi.stubEnv("TWITCH_CLIENT_ID", creds ? "id" : "");
    vi.stubEnv("TWITCH_CLIENT_SECRET", creds ? "segredo" : "");
  };

  it("padrão: só YouTube", () => {
    env("", true);
    expect(getActivePlatforms()).toEqual(["youtube"]);
  });
  it("twitch listada sem credenciais fica de fora", () => {
    env("youtube,twitch", false);
    expect(getActivePlatforms()).toEqual(["youtube"]);
  });
  it("twitch listada com credenciais entra, na ordem da lista", () => {
    env("youtube,twitch", true);
    expect(getActivePlatforms()).toEqual(["youtube", "twitch"]);
  });
  it("twitch sem credenciais e sozinha volta para o YouTube", () => {
    env("twitch", false);
    expect(getActivePlatforms()).toEqual(["youtube"]);
  });
});
