import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import { SiteAnalytics } from "@/components/analytics/site-analytics";
import { siteConfig } from "@/lib/config/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["500", "600", "700"] });

/** Base das URLs absolutas (Open Graph). Em desenvolvimento, sem variável, usa localhost. */
function siteUrl(): URL | undefined {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === "production" ? siteConfig.url : undefined);
  try {
    return raw ? new URL(raw) : undefined;
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: siteConfig.title,
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090D",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-text-primary">
        {children}
        <SiteAnalytics />
      </body>
    </html>
  );
}
