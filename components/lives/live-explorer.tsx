"use client";

import { useMemo, useRef, useState } from "react";
import { LiveCard } from "@/components/lives/live-card";
import { LiveCardSkeleton } from "@/components/lives/live-card-skeleton";
import { LiveFilters, type FilterValue } from "@/components/lives/live-filters";
import { LivePlayerDialog } from "@/components/lives/live-player-dialog";
import { useLives } from "@/components/lives/lives-provider";
import { RefreshStatus } from "@/components/lives/refresh-status";
import { EmptyState, ErrorState, QuotaState, SetupState } from "@/components/lives/states";
import { Button } from "@/components/ui/button";
import { applyLiveFilters } from "@/lib/lives/filter";
import { liveDomId } from "@/lib/lives/identity";
import { coverageNote } from "@/lib/lives/copy";
import { activePlatforms, hasPartialFailure } from "@/lib/lives/sources";

const EMPTY_FILTERS: FilterValue = { q: "", lang: "all", sort: "relevance", platform: "all" };

const notice = "rounded-lg bg-surface px-4 py-3 text-sm text-text-secondary ring-1 ring-border";

export function LiveExplorer() {
  const { state, dispatch, demoAllowed, demo, now, cooldownLeft, refresh, loadMore, platforms: configured } = useLives();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Consentimento para carregar o player do YouTube: só nesta visita (spec 002 D3).
  const [playerConsent, setPlayerConsent] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [filters, setFilters] = useState<FilterValue>(EMPTY_FILTERS);

  const platforms = activePlatforms(state.meta?.sources);
  const multi = platforms.length > 1;
  // Com uma plataforma ativa, o filtro de plataforma é ignorado (spec 026 D4).
  const platformFilter = multi ? filters.platform : "all";
  const visible = useMemo(
    () => applyLiveFilters(state.items, { q: filters.q, lang: filters.lang, sort: filters.sort, platform: platformFilter }),
    [state.items, filters, platformFilter],
  );
  const selected = selectedId ? state.items.find((it) => it.id === selectedId) : undefined;

  function openPlayer(id: string) {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedId(id);
  }

  function closePlayer() {
    const item = selected;
    setSelectedId(null);
    // Devolve o foco ao botão que abriu o diálogo (spec 045 D1).
    const trigger = triggerRef.current;
    if (trigger?.isConnected) return trigger.focus();
    // Live encerrada ou indisponível: o "Assistir aqui" saiu do card; vai para o link da plataforma (D2).
    const card = item ? document.getElementById(`${liveDomId(item)}-title`)?.closest("article") : null;
    const link = card?.querySelector<HTMLElement>("a[href]");
    if (link) return link.focus();
    // Sem o card: título da seção, nunca o <body> (D3).
    document.getElementById("lives-title")?.focus();
  }
  const filtered = filters.q.trim() !== "" || filters.lang !== "all" || platformFilter !== "all";
  const partial = hasPartialFailure(state.meta?.sources);
  const err = state.error;

  return (
    <section id="lives" aria-labelledby="lives-title" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 id="lives-title" tabIndex={-1} className="sr-only">
          Lives encontradas
        </h2>

        {demo && (
          <div className={`mb-6 ${notice}`} role="note">
            <p className="font-medium text-text-primary">Dados simulados, não são lives reais</p>
            <p className="mt-1">Exibidos só em desenvolvimento. {state.notice}</p>
          </div>
        )}

        <div className="space-y-6">
          <RefreshStatus
            loading={state.phase === "loading"}
            unavailable={state.phase === "error"}
            refreshing={state.refreshing}
            total={state.items.length}
            visible={visible.length}
            updatedAt={state.meta?.updatedAt ?? null}
            cached={state.meta?.cached ?? false}
            demo={demo}
            cooldownLeft={cooldownLeft}
            onRefresh={refresh}
          />

          <LiveFilters value={filters} onChange={setFilters} disabled={state.phase !== "ready"} platforms={platforms} />

          <p className="text-xs leading-relaxed text-text-secondary">
            {coverageNote(configured)} Idioma estimado a partir de metadados e título.
          </p>

          {state.meta?.stale && !err && (
            <div role="status" className={notice}>
              {multi ? "Uma das plataformas" : "O YouTube"} não respondeu agora. Mostrando resultados salvos da última
              consulta; algumas lives podem já ter terminado.
            </div>
          )}

          {state.phase === "ready" && partial && (
            <div role="status" className={notice}>
              Algumas plataformas estão indisponíveis agora. Mostrando as lives das que responderam.
            </div>
          )}

          {state.phase === "ready" && err && (
            <div role="alert" className={notice}>
              Não foi possível atualizar: {err.message} Mostrando os resultados anteriores.
            </div>
          )}

          {state.phase === "loading" && (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Carregando lives">
              {Array.from({ length: 8 }, (_, i) => (
                <li key={i}>
                  <LiveCardSkeleton />
                </li>
              ))}
            </ul>
          )}

          {state.phase === "error" && err && (
            err.code === "quota_exceeded" ? (
              <QuotaState message={err.message} />
            ) : err.code === "missing_api_key" ? (
              <SetupState message={err.message} production={!demoAllowed} />
            ) : (
              <ErrorState message={err.message} onRetry={refresh} retryDisabled={cooldownLeft > 0 || state.refreshing} />
            )
          )}

          {state.phase === "ready" && (
            visible.length === 0 ? (
              <EmptyState
                filtered={filtered && state.items.length > 0}
                platformFilter={multi}
                onClear={() => setFilters(EMPTY_FILTERS)}
              />
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visible.map((item, i) => (
                  <li key={item.id}>
                    <LiveCard
                      item={item}
                      demo={demo}
                      index={i}
                      now={now}
                      showPlatform={multi}
                      onWatchHere={() => openPlayer(item.id)}
                    />
                  </li>
                ))}
              </ul>
            )
          )}

          {state.phase === "ready" && state.next && !demo && (
            <div className="flex flex-col items-center gap-3 pt-4">
              <Button onClick={loadMore} disabled={state.loadingMore} aria-busy={state.loadingMore}>
                {state.loadingMore ? "Carregando…" : "Carregar mais lives"}
              </Button>
              {state.moreError && (
                <p role="alert" className="text-sm text-text-secondary">
                  {state.moreError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <LivePlayerDialog
          key={selected.id}
          item={selected}
          demo={demo}
          consented={playerConsent}
          onConsent={() => setPlayerConsent(true)}
          onStatus={(status) => dispatch({ type: "item-status", status })}
          onClose={closePlayer}
        />
      )}
    </section>
  );
}
