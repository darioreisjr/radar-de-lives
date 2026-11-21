import Link from "next/link";
import { RadarMark } from "@/components/ui/radar-mark";
import { siteConfig } from "@/lib/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${siteConfig.name} — início`}>
          <RadarMark className="size-8" />
          <span className="font-display text-lg font-semibold uppercase tracking-[0.12em]">
            Radar <span className="text-accent-pink">de</span> Lives
          </span>
        </Link>
        <nav aria-label="Principal">
          <ul className="flex items-center gap-1 text-sm text-text-secondary">
            <li>
              <Link href="/#lives" className="rounded-md px-3 py-2 transition-colors duration-[140ms] hover:text-text-primary">
                Lives
              </Link>
            </li>
            <li>
              <a href="#sobre" className="rounded-md px-3 py-2 transition-colors duration-[140ms] hover:text-text-primary">
                Sobre
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
