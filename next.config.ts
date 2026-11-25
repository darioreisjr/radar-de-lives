import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança aplicados a todas as rotas (spec 010 / sprint S-05).
 * - Referrer-Policy precisa manter o Referer: o player do YouTube exige (Required Minimum Functionality).
 * - Permissions-Policy NÃO restringe fullscreen, picture-in-picture, encrypted-media e autoplay,
 *   usados pelo iframe do YouTube.
 * - Sem Cross-Origin-Embedder/Opener-Policy: bloqueariam o iframe e as miniaturas de i.ytimg.com.
 * - CSP completa aplicada (S-12), validada antes em Report-Only; inclui frame-ancestors 'none'.
 */

const isDev = process.env.NODE_ENV === "development";

/**
 * CSP completa (spec 017 / sprint S-12). Sem nonce: nonce obriga renderização dinâmica e é
 * incompatível com o prerender parcial (doc do Next 16, guia content-security-policy), então
 * os scripts inline do Next exigem 'unsafe-inline'. 'unsafe-eval' só no next dev (React).
 * - img-src: miniaturas oficiais em i.ytimg.com (YouTube) e static-cdn.jtvnw.net (Twitch, spec 031).
 * - frame-src: players oficiais em www.youtube.com e player.twitch.tv (spec 031). Origens exatas, sem curinga.
 * - connect-src fica 'self': o navegador só fala com a nossa API; Twitch e YouTube são chamados no servidor.
 * - O Vercel Web Analytics é servido no próprio domínio, coberto por 'self'.
 */
export const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com https://static-cdn.jtvnw.net",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.youtube.com https://player.twitch.tv",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
] as const;

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Somente dev server: permite abrir via http://127.0.0.1 (além de localhost).
  allowedDevOrigins: ["127.0.0.1"],
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Miniaturas oficiais do YouTube. Servidas sem otimização (D14) para não gerar custo.
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders] }];
  },
};

export default nextConfig;
