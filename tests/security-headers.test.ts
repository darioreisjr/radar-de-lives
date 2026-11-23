import { describe, expect, it } from "vitest";
import nextConfig, { contentSecurityPolicy, securityHeaders } from "../next.config";

const byKey: Record<string, string> = Object.fromEntries(securityHeaders.map((h) => [h.key, h.value]));
const { "Content-Security-Policy-Report-Only": reportOnly, ...s05 } = byKey;

describe("cabeçalhos de segurança (spec 010)", () => {
  it("tem exatamente os 5 cabeçalhos da S-05", () => {
    expect(s05).toEqual({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Content-Security-Policy": "frame-ancestors 'none'",
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
  it("está em Report-Only com a mesma política exportada", () => {
    expect(reportOnly).toBe(contentSecurityPolicy);
  });

  it("libera só o necessário para miniaturas, player e Analytics", () => {
    expect(csp["default-src"]).toEqual(["'self'"]);
    expect(csp["img-src"]).toEqual(["'self'", "data:", "blob:", "https://i.ytimg.com"]);
    expect(csp["frame-src"]).toEqual(["https://www.youtube.com"]);
    expect(csp["connect-src"]).toEqual(["'self'"]);
    expect(csp["font-src"]).toEqual(["'self'"]);
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
