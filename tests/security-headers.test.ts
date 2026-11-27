import { describe, expect, it } from "vitest";
import nextConfig, { contentSecurityPolicy, securityHeaders } from "../next.config";

const byKey: Record<string, string> = Object.fromEntries(securityHeaders.map((h) => [h.key, h.value]));

describe("cabeçalhos de segurança (spec 010)", () => {
  it("tem exatamente os 5 cabeçalhos da S-05 (a CSP agora é a completa da S-12)", () => {
    expect(byKey).toEqual({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Content-Security-Policy": contentSecurityPolicy,
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    });
  });

  it("mantém o Referer exigido pelo player do YouTube", () => {
    expect(byKey["Referrer-Policy"]).not.toMatch(/no-referrer(?!-when)/);
  });

  it("não restringe recursos usados pelo iframe do YouTube", () => {
    for (const feature of ["fullscreen", "picture-in-picture", "encrypted-media", "autoplay"]) {
      expect(byKey["Permissions-Policy"]).not.toContain(feature);
    }
  });

  it("não usa Cross-Origin-Embedder/Opener-Policy", () => {
    expect(Object.keys(byKey).some((k) => k.startsWith("Cross-Origin-"))).toBe(false);
  });

  it("aplica a todas as rotas e remove o x-powered-by", async () => {
    expect(nextConfig.poweredByHeader).toBe(false);
    const rules = await nextConfig.headers!();
    expect(rules).toEqual([{ source: "/:path*", headers: [...securityHeaders] }]);
  });
});

/** Diretivas da CSP como mapa: "img-src" -> ["'self'", ...]. */
const csp = Object.fromEntries(
  contentSecurityPolicy.split(";").map((d) => {
    const [name, ...values] = d.trim().split(/\s+/);
    return [name, values];
  }),
);

describe("CSP completa (spec 017)", () => {
  it("está aplicada, sem Report-Only, e continua impedindo o embutimento", () => {
    expect(byKey["Content-Security-Policy"]).toBe(contentSecurityPolicy);
    expect(byKey).not.toHaveProperty("Content-Security-Policy-Report-Only");
    expect(byKey["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
  });

  it("libera só o necessário para miniaturas, player e Analytics", () => {
    expect(csp["default-src"]).toEqual(["'self'"]);
    expect(csp["img-src"]).toEqual([
      "'self'",
      "data:",
      "blob:",
      "https://i.ytimg.com",
      "https://static-cdn.jtvnw.net",
      "https://images.kick.com",
      "https://web.kick.com",
    ]);
    expect(csp["frame-src"]).toEqual(["https://www.youtube.com", "https://player.twitch.tv", "https://player.kick.com"]);
    expect(csp["connect-src"]).toEqual(["'self'"]);
    expect(csp["font-src"]).toEqual(["'self'"]);
  });

  it("Twitch (spec 031): só as origens exatas, sem curinga, e YouTube sem mudança", () => {
    expect(csp["img-src"]).toContain("https://static-cdn.jtvnw.net");
    expect(csp["frame-src"]).toContain("https://player.twitch.tv");
    // YouTube continua liberado como antes (CA3).
    expect(csp["img-src"]).toContain("https://i.ytimg.com");
    expect(csp["frame-src"]).toContain("https://www.youtube.com");
    // Nenhum curinga de subdomínio nem esquema solto (CA1).
    for (const values of Object.values(csp)) {
      for (const v of values) expect(v).not.toMatch(/\*|^https?:$/);
    }
    // Chamadas à Twitch são do servidor: o navegador só fala com a nossa API (D2).
    expect(csp["connect-src"]).toEqual(["'self'"]);
  });

  it("Kick (spec 050): só as origens exatas, sem curinga; YouTube e Twitch sem mudança", () => {
    expect(csp["img-src"]).toEqual(expect.arrayContaining(["https://images.kick.com", "https://web.kick.com"]));
    expect(csp["frame-src"]).toContain("https://player.kick.com");
    // Foto de perfil e capa da categoria não aparecem no card (D1).
    expect(csp["img-src"]).not.toContain("https://files.kick.com");
    // YouTube e Twitch continuam liberados como antes (CA3).
    expect(csp["img-src"]).toEqual(expect.arrayContaining(["https://i.ytimg.com", "https://static-cdn.jtvnw.net"]));
    expect(csp["frame-src"]).toEqual(expect.arrayContaining(["https://www.youtube.com", "https://player.twitch.tv"]));
    for (const values of Object.values(csp)) {
      for (const v of values) expect(v).not.toMatch(/\*|^https?:$/);
    }
    // API e token da Kick são chamados no servidor (D3).
    expect(csp["connect-src"]).toEqual(["'self'"]);
  });

  it("fecha object, base, form e embutimento", () => {
    expect(csp["object-src"]).toEqual(["'none'"]);
    expect(csp["base-uri"]).toEqual(["'self'"]);
    expect(csp["form-action"]).toEqual(["'self'"]);
    expect(csp["frame-ancestors"]).toEqual(["'none'"]);
  });

  it("scripts só do próprio domínio, sem curinga nem eval em produção", () => {
    expect(csp["script-src"]).toEqual(["'self'", "'unsafe-inline'"]);
    expect(contentSecurityPolicy).not.toMatch(/(^|\s)\*(\s|;|$)|https?:(\s|;|$)/);
  });
});
