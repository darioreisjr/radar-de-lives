import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";

/** Origem absoluta do site: NEXT_PUBLIC_SITE_URL, senão siteConfig.url (spec 012). */
export function siteOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url).origin;
  } catch {
    return new URL(siteConfig.url).origin;
  }
}

/** Páginas públicas indexáveis. A API (/api/*) fica de fora (spec 012 CA3). */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  const legalUpdated = siteConfig.legal.updatedAt;
  return [
    { url: `${origin}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${origin}/privacy`, lastModified: legalUpdated, changeFrequency: "monthly", priority: 0.3 },
    { url: `${origin}/terms`, lastModified: legalUpdated, changeFrequency: "monthly", priority: 0.3 },
  ];
}
