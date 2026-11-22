import { describe, expect, it } from "vitest";
import nextConfig, { securityHeaders } from "../next.config";

const byKey = Object.fromEntries(securityHeaders.map((h) => [h.key, h.value]));

describe("cabeçalhos de segurança (spec 010)", () => {
  it("tem exatamente os 5 cabeçalhos da S-05", () => {
    expect(byKey).toEqual({
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
