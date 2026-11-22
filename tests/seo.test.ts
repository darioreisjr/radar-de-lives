import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

afterEach(() => vi.unstubAllEnvs());

describe("robots e sitemap (spec 012)", () => {
  it("usa NEXT_PUBLIC_SITE_URL como base e bloqueia só /api/", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://exemplo.test/");
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: "/api/" },
      sitemap: "https://exemplo.test/sitemap.xml",
    });
  });

  it("sem variável, cai para o domínio de produção", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(robots().sitemap).toBe("https://radardelives.darioreis.dev/sitemap.xml");
    expect(sitemap().map((e) => e.url)).toEqual([
      "https://radardelives.darioreis.dev/",
      "https://radardelives.darioreis.dev/privacy",
      "https://radardelives.darioreis.dev/terms",
    ]);
  });

  it("com variável inválida, cai para o domínio de produção", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "não é url");
    expect(robots().sitemap).toBe("https://radardelives.darioreis.dev/sitemap.xml");
  });

  it("home horária, páginas legais mensais e nenhuma rota de API", () => {
    const entries = sitemap();
    expect(entries.map((e) => e.changeFrequency)).toEqual(["hourly", "monthly", "monthly"]);
    expect(entries.some((e) => e.url.includes("/api"))).toBe(false);
  });
});
