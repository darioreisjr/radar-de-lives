import Image from "next/image";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { Button, buttonBase, buttonStyles } from "@/components/ui/button";
import { LANGUAGE_LABEL, formatRelative, formatViewers } from "@/lib/utils/format";
import type { LiveItem } from "@/lib/youtube/types";

/** Sem miniatura: superfície neutra com rótulo discreto (spec 007). */
function Placeholder({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-surface-raised" aria-hidden="true">
      <span className="text-sm text-text-secondary">{label}</span>
    </div>
  );
}

const externalIcon = (
  <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
    <path d="M6 3h7v7M13 3 4 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

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
      className="motion-lift group flex h-full flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-border transition-[transform,box-shadow] duration-[140ms] ease-out animate-card-in hover:-translate-y-0.5 hover:ring-border-strong focus-within:ring-accent-cyan/70"
      style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
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
          <Placeholder label={demo ? "Simulado" : "Sem miniatura"} />
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          {ended ? <Badge>Encerrada</Badge> : <LiveBadge />}
          {demo && <Badge tone="demo">Simulado</Badge>}
        </div>
        <div className={`absolute bottom-3 right-3 ${ended ? "hidden" : ""}`}>
          <span
            className="rounded-md bg-background/85 px-2 py-1 font-mono text-xs tabular-nums text-accent-cyan backdrop-blur-sm"
            title={viewers.full}
          >
            <span className="sr-only">{viewers.full}</span>
            <span aria-hidden="true">
              {item.concurrentViewers === null ? "Espectadores: não informado" : `${viewers.short} assistindo`}
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 id={titleId} className="line-clamp-2 text-base font-medium leading-snug text-text-primary" title={item.title}>
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
        {/* Ações neutras: a cor fica nas miniaturas; rosa só na ação principal do hero (spec 007 D2). */}
        <div className="mt-auto flex gap-2 pt-1">
          {demo ? (
            <Button onClick={onWatchHere} aria-describedby={titleId} aria-haspopup="dialog" className="flex-1">
              Ver player (simulado)
            </Button>
          ) : (
            <>
              {!ended && item.embedAllowed !== false && (
                <Button onClick={onWatchHere} aria-describedby={titleId} aria-haspopup="dialog" className="flex-1">
                  Assistir aqui
                </Button>
              )}
              <a
                href={item.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonBase} ${buttonStyles.ghost} ${ended || item.embedAllowed === false ? "flex-1" : ""}`}
                aria-describedby={titleId}
              >
                {ended ? "Abrir no YouTube" : "YouTube"}
                <span className="sr-only">(abre em nova aba)</span>
                {externalIcon}
              </a>
            </>
          )}
        </div>
        {!demo && !ended && item.embedAllowed === false && (
          <p className="-mt-1 text-xs text-text-secondary">Incorporação desativada pelo canal</p>
        )}
      </div>
    </article>
  );
}
