import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { getServerEnv } from "@/lib/config/server-env";
import { siteConfig } from "@/lib/config/site";

/**
 * Spec 033: os textos legais precisam refletir o que o código faz (CLAUDE.md).
 * Lê o código-fonte das páginas para conferir links, idade e tempos de cache.
 */
const privacy = readFileSync("app/privacy/page.tsx", "utf-8").replace(/\s+/g, " ");
const terms = readFileSync("app/terms/page.tsx", "utf-8").replace(/\s+/g, " ");

const TWITCH_PRIVACY = "https://legal.twitch.com/legal/privacy-notice/";
const TWITCH_TERMS = "https://legal.twitch.com/legal/terms-of-service/";

describe("textos legais com a Twitch (spec 033)", () => {
  it("política e termos citam a API, os termos e o aviso de privacidade da Twitch", () => {
    for (const page of [privacy, terms]) {
      expect(page).toContain(TWITCH_PRIVACY);
      expect(page).toContain(TWITCH_TERMS);
    }
    expect(privacy).toContain("Uso da API da Twitch");
    expect(privacy).toContain("static-cdn.jtvnw.net");
    expect(privacy).toContain("não envia dados de quem visita o site");
  });

  it("idade mínima de 13 anos (Developer Agreement da Twitch)", () => {
    expect(terms).toContain("não é direcionado a crianças menores de 13 anos");
    expect(privacy).toContain("não é direcionado a crianças menores de 13 anos");
  });

  it("aviso de marca e ausência de afiliação incluem a Twitch", () => {
    expect(siteConfig.disclaimer).toContain("YouTube ou Twitch");
    expect(terms).toContain("YouTube ou pela Twitch");
  });

  it("tempos de cache do texto batem com os padrões do código", () => {
    vi.stubEnv("LIVE_CACHE_TTL_SECONDS", "");
    vi.stubEnv("LIVE_STALE_TTL_SECONDS", "");
    vi.stubEnv("TWITCH_CACHE_TTL_SECONDS", "");
    vi.stubEnv("TWITCH_STALE_TTL_SECONDS", "");
    const env = getServerEnv();
    vi.unstubAllEnvs();
    const min = (s: number) => s / 60;
    // YouTube: 15 min + 10 min; Twitch: 3 min + 10 min.
    expect([min(env.cacheTtlSeconds), min(env.staleTtlSeconds)]).toEqual([15, 10]);
    expect([min(env.twitchCacheTtlSeconds), min(env.twitchStaleTtlSeconds)]).toEqual([3, 10]);
    expect(privacy).toContain("os da Twitch por 3 minutos e, como dado antigo, por até cerca de 13 minutos no total");
    expect(privacy).toContain("Twitch, 3 minutos, mais até cerca de 10 minutos como dado antigo");
    expect(terms).toContain("ou 13 minutos (Twitch)");
  });

  it("a data de atualização mudou, o que pede novo aceite (spec 016)", () => {
    expect(siteConfig.legal.updatedAt).toBe("2026-11-25");
  });
});
