import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança aplicados a todas as rotas (spec 010 / sprint S-05).
 * - Referrer-Policy precisa manter o Referer: o player do YouTube exige (Required Minimum Functionality).
 * - Permissions-Policy NÃO restringe fullscreen, picture-in-picture, encrypted-media e autoplay,
 *   usados pelo iframe do YouTube.
 * - Sem Cross-Origin-Embedder/Opener-Policy: bloqueariam o iframe e as miniaturas de i.ytimg.com.
 * - A CSP completa é outra tarefa (S-12); aqui só frame-ancestors.
 */
export const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
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
