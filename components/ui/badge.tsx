import type { ReactNode } from "react";

type Tone = "live" | "demo" | "neutral" | "data";

const tones: Record<Tone, string> = {
  live: "bg-background/85 text-text-primary ring-1 ring-border-strong",
  demo: "bg-background/85 text-text-primary ring-1 ring-border-strong",
  neutral: "bg-surface-raised text-text-secondary ring-1 ring-border",
  data: "bg-accent-cyan/10 text-accent-cyan ring-1 ring-accent-cyan/40",
};

export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium backdrop-blur-sm ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function LiveBadge() {
  return (
    <Badge tone="live">
      <span className="size-2 rounded-full bg-live-red animate-live-pulse" aria-hidden="true" />
      Ao vivo
    </Badge>
  );
}
