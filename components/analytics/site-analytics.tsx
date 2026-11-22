"use client";

import { Analytics } from "@vercel/analytics/next";
import { stripQuery } from "@/lib/analytics";

/** Vercel Web Analytics só com page views e URL sem query string (spec 006). */
export function SiteAnalytics() {
  return <Analytics beforeSend={stripQuery} />;
}
