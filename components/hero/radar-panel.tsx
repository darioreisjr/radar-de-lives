"use client";

import { useLives } from "@/components/lives/lives-provider";
import { languageBreakdown, liveCount, topAudience } from "@/lib/lives/radar-stats";
import { formatClock, formatViewers } from "@/lib/utils/format";
import type { LiveLanguage } from "@/lib/youtube/types";

const LANG: Record<LiveLanguage, string> = { pt: "Português", en: "Inglês", es: "Espanhol", unknown: "Outro" };

/**
 * Painel do radar (spec 007 D3): resumo da MESMA consulta da grade, sem quota extra e sem dados inventados.
 * Mostra o total encontrado, mesmo com filtros aplicados na grade.
 */
export function RadarPanel() {
  const { state, demo } = useLives();
  const loading = state.phase === "loading";
  const unavailable = state.phase === "error";
  const total = liveCount(state.items);
  const langs = languageBreakdown(state.items);
  const top = topAudience(state.items);

  return (
    <section
      aria-labelledby="radar-title"
      className="rounded-2xl bg-surface p-5 ring-1 ring-border sm:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="radar-title" className="flex items-center gap-2 text-sm text-text-secondary">
          <span
            className={`size-2 rounded-full ${unavailable ? "bg-text-secondary/50" : "bg-live-red animate-live-pulse"}`}
            aria-hidden="true"
          />
          {demo ? "Radar, dados simulados" : "Radar"}
        </h2>
        {state.meta?.updatedAt && (
          <p className="font-mono text-xs text-text-secondary">
            Atualizado às <time dateTime={state.meta.updatedAt}>{formatClock(state.meta.updatedAt).slice(0, 5)}</time>
          </p>
        )}
      </div>

      {loading ? (
        <div className="mt-6 space-y-4" aria-hidden="true">
          <div className="skeleton h-12 w-24 rounded" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-4/5 rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
        </div>
      ) : unavailable ? (
        <p className="mt-6 text-sm leading-relaxed text-text-secondary">
          Busca indisponível no momento. Os números voltam quando a consulta ao YouTube responder.
        </p>
      ) : (
        <>
          <p className="mt-6 flex items-baseline gap-3">
            <span className="font-mono text-5xl font-medium tabular-nums text-text-primary">{total}</span>
            <span className="text-sm text-text-secondary">{total === 1 ? "live no ar" : "lives no ar"}</span>
          </p>

          {langs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs text-text-secondary">Por idioma estimado</h3>
              <ul className="mt-3 space-y-2">
                {langs.map((l, i) => (
                  <li key={l.language} className="grid grid-cols-[88px_1fr_32px] items-center gap-3 text-sm">
                    <span className="text-text-primary">{LANG[l.language]}</span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-surface-raised" aria-hidden="true">
                      <span
                        className={`block h-full rounded-full ${i === 0 ? "bg-accent-cyan" : "bg-text-secondary/40"}`}
                        style={{ width: `${Math.max(4, Math.round(l.share * 100))}%` }}
                      />
                    </span>
                    <span className="text-right font-mono tabular-nums text-text-secondary">{l.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 border-t border-border pt-4">
            <h3 className="text-xs text-text-secondary">Maior público informado</h3>
            {top ? (
              <p className="mt-2 flex items-baseline justify-between gap-4">
                <span className="truncate text-sm text-text-primary">{top.channelTitle}</span>
                <span className="shrink-0 font-mono text-sm tabular-nums text-accent-cyan">
                  {formatViewers(top.concurrentViewers).short}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-text-secondary">Nenhum canal informou o público</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
