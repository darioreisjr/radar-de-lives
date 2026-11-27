import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { getServerEnv } from "@/lib/config/server-env";
import { siteConfig } from "@/lib/config/site";

/**
 * Spec 052: os textos legais precisam refletir o que o código faz (CLAUDE.md) e as exigências
 * dos Developer Terms da Kick (spec 020, P4). Lê o código-fonte das páginas.
 */
const privacy = readFileSync("app/privacy/page.tsx", "utf-8").replace(/\s+/g, " ");
const terms = readFileSync("app/terms/page.tsx", "utf-8").replace(/\s+/g, " ");
const platforms = readFileSync("lib/lives/platforms.ts", "utf-8");

const KICK_PRIVACY = "https://kick.com/privacy-policy";
const KICK_TERMS = "https://kick.com/terms-of-service";

describe("textos legais com a Kick (spec 052)", () => {
  it("CA1: a política cita a API, as miniaturas, o player e a política de privacidade da Kick", () => {
    expect(privacy).toContain("Uso da API da Kick");
    expect(privacy).toContain("images.kick.com e web.kick.com");
    expect(privacy).toContain("o player do YouTube, da Twitch ou da Kick não é carregado automaticamente");
    expect(privacy).toContain("<strong>Kick:</strong>");
    for (const page of [privacy, terms]) {
      expect(page).toContain(KICK_PRIVACY);
      expect(page).toContain(KICK_TERMS);
    }
    // O link do aviso de consentimento do player é o mesmo da política (spec 051).
    expect(platforms).toContain(KICK_PRIVACY);
  });

  it("CA1: o servidor não envia dados de quem visita à Kick", () => {
    const secao = privacy.slice(privacy.indexOf("Uso da API da Kick"), privacy.indexOf("Dados tratados, finalidades"));
    expect(secao).toContain("não envia dados de quem visita o site");
  });

  it("CA2: aviso de marca e ausência de afiliação incluem a Kick, sem logotipos", () => {
    expect(siteConfig.disclaimer).toContain("YouTube, Twitch ou Kick");
    expect(siteConfig.disclaimer).toContain("YouTube, Twitch e Kick são marcas");
    expect(terms).toContain("pela Twitch ou pela Kick");
    expect(terms).toContain("&ldquo;Kick&rdquo; aparecem só para indicar a origem");
  });

  it("CA2: idade mínima de 16 anos no site inteiro (D1; Developer Terms da Kick)", () => {
    expect(terms).toContain("não é direcionado a menores de 16 anos");
    expect(privacy).toContain("não é direcionado a menores de 16 anos");
  });

  it("D4 e D5: selo adulto na Kick explicado e re-distribuição proibida", () => {
    expect(terms).toContain("o selo não aparece nas lives da Kick");
    expect(terms).toContain("não copie nem redistribua em massa os dados exibidos");
  });

  it("CA4: tempos de cache da Kick no texto batem com os padrões do código (D3)", () => {
    vi.stubEnv("KICK_CACHE_TTL_SECONDS", "");
    vi.stubEnv("KICK_STALE_TTL_SECONDS", "");
    const env = getServerEnv();
    vi.unstubAllEnvs();
    expect([env.kickCacheTtlSeconds / 60, env.kickStaleTtlSeconds / 60]).toEqual([3, 10]);
    expect(privacy).toContain("os da Twitch e os da Kick por 3 minutos");
    expect(terms).toContain("13 minutos (Twitch e Kick)");
  });

  it("CA4: a data de atualização mudou, o que pede novo aceite (D7)", () => {
    expect(siteConfig.legal.updatedAt).toBe("2026-11-27");
  });
});
