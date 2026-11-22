import type { MetadataRoute } from "next";
import { siteOrigin } from "./sitemap";

/** Permite tudo, exceto a API, e aponta para o sitemap (spec 012). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
