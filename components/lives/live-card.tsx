import Image from "next/image";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { Button, buttonBase, buttonStyles } from "@/components/ui/button";
import { LANGUAGE_LABEL, formatRelative, formatViewers } from "@/lib/utils/format";
import type { LiveItem } from "@/lib/youtube/types";

function Placeholder({ seed, label }: { seed: number; label: string }) {
  const hues = ["from-accent-violet/50 to-accent-pink/40", "from-accent-cyan/40 to-accent-violet/40", "from-accent-pink/50 to-[#3a1648]"];
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${hues[seed % hues.length]}`} aria-hidden="true">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_3px,rgba(9,9,13,0.35)_3px_4px)]" />
      <span className="absolute inset-0 grid place-items-center font-display text-2xl font-bold uppercase tracking-[0.2em] text-text-primary/70">
        {label}
      </span>
    </div>
  );
}

export function LiveCard({
  item,
  demo,
  index,
  now,
  onWatchHere,
}: {
  item: LiveItem;
  demo: boolean;
  index: number;
  now: number;
  onWatchHere: () => void;
}) {
  const ended = !item.isLive;
  const viewers = formatViewers(item.concurrentViewers);
  const started = formatRelative(item.liveStartedAt, now);
  const titleId = `live-${item.videoId}-title`;

  return (
    <article
      aria-labelledby={titleId}
      className="motion-lift group flex h-full flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-border transition-[transform,box-shadow] duration-[240ms] ease-out animate-card-in hover:-translate-y-[3px] hover:ring-accent-pink/60 hover:shadow-[0_12px_40px_-18px_rgba(255,61,129,0.55)] focus-within:ring-accent-cyan/70"
      style={{ animationDelay: `${Math.min(index, 11) * 40}ms` }}
    >
      <div className="relative aspect-video overflow-hidden bg-surface-raised">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <Placeholder seed={index} label={demo ? "Simulado" : "Sem miniatura"} />
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
          {ended ? <Badge>Encerrada</Badge> : <LiveBadge />}
          {demo && <Badge tone="demo">Simulado</Badge>}
        </div>
        <div className={`absolute bottom-2.5 right-2.5 ${ended ? "hidden" : ""}`}>
          <span
            className="rounded-md bg-background/85 px-2 py-1 font-mono text-xs text-accent-cyan backdrop-blur-sm"
            title={viewers.full}
          >
            <span className="sr-only">{viewers.full}</span>
            <span aria-hidden="true">
              {item.concurrentViewers === null ? "Espectadores: não informado" : `${viewers.short} assistindo`}
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 id={titleId} className="line-clamp-2 text-base font-semibold leading-snug text-text-primary" title={item.title}>
          {item.title}
        </h3>
        <p className="truncate text-sm text-text-secondary">{item.channelTitle}</p>
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
          <div className="flex gap-1">
            <dt className="sr-only">Início</dt>
            <dd>
              {ended ? "Live encerrada após a busca" : started ? `Começou ${started}` : "Início não informado"}
            </dd>
          </div>
          <div className="flex gap-1">
            <dt>Idioma (estimado):</dt>
            <dd className="text-text-primary/90">{LANGUAGE_LABEL[item.language]}</dd>
          </div>
        </dl>
        <div className="mt-auto flex flex-col gap-2 pt-1">
          {demo ? (
            <>
              <p className="rounded-lg bg-surface-raised px-3 py-2.5 text-center text-xs text-text-secondary ring-1 ring-border">
                Exemplo sem vídeo real
              </p>
              <Button onClick={onWatchHere} aria-describedby={titleId}>
                Ver player (simulado)
              </Button>
            </>
          ) : (
            <>
              <a
                href={item.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonBase} ${ended ? buttonStyles.ghost : buttonStyles.primary} w-full`}
                aria-describedby={titleId}
              >
                {ended ? "Abrir no YouTube" : "Assistir no YouTube"}
                <span className="sr-only">(abre em nova aba)</span>
                <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
                  <path d="M6 3h7v7M13 3 4 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </a>
              {ended ? null : item.embedAllowed === false ? (
                <p className="text-center text-xs text-text-secondary">Incorporação desativada pelo canal</p>
              ) : (
                <Button onClick={onWatchHere} aria-describedby={titleId} aria-haspopup="dialog">
                  Assistir aqui
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
