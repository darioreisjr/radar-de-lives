"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { LiveCard } from "@/components/lives/live-card";
import { LiveCardSkeleton } from "@/components/lives/live-card-skeleton";
import { LiveFilters, type FilterValue } from "@/components/lives/live-filters";
import { LivePlayerDialog } from "@/components/lives/live-player-dialog";
import { RefreshStatus } from "@/components/lives/refresh-status";
import { EmptyState, ErrorState, QuotaState, SetupState } from "@/components/lives/states";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config/site";
import {
  explorerReducer,
  initialExplorerState,
  type ApiError,
  type ExplorerAction,
} from "@/lib/lives/explorer-state";
import { applyLiveFilters } from "@/lib/lives/filter";
import type { LivesErrorPayload, LivesPayload } from "@/lib/youtube/types";

async function requestLives(pageToken?: string): Promise<{ ok: true; data: LivesPayload } | { ok: false; error: ApiError }> {
  try {
    const qs = pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : "";
    const res = await fetch(`/api/lives${qs}`, { cache: "no-store", headers: { Accept: "application/json" } });
    const body = (await res.json()) as LivesPayload | LivesErrorPayload;
    if (!res.ok || "error" in body) {
      const err = "error" in body ? body.error : { code: "upstream_unavailable" as const, message: "Resposta inesperada." };
      return { ok: false, error: err };
    }
    return { ok: true, data: body };
  } catch {
    return { ok: false, error: { code: "network", message: "Sem conexão com o servidor. Verifique sua internet e tente novamente." } };
  }
}

/** Primeira página. Sem chave e fora de produção, carrega fixtures rotuladas (D15). */
async function loadFirstPage(demoAllowed: boolean): Promise<ExplorerAction> {
  const r = await requestLives();
  if (r.ok) return { type: "loaded", payload: r.data };
  if (r.error.code === "missing_api_key" && demoAllowed) {
    const { getDemoLives } = await import("@/lib/fixtures/lives");
    return {
      type: "loaded",
      notice: r.error.message,
      payload: {
        items: getDemoLives(),
        updatedAt: new Date().toISOString(),
        cached: false,
        stale: false,
        nextPageToken: null,
        source: "fixture",
      },
    };
  }
  return { type: "failed", error: r.error };
}

const EMPTY_FILTERS: FilterValue = { q: "", lang: "all", sort: "relevance" };

export function LiveExplorer({ demoAllowed }: { demoAllowed: boolean }) {
  const [state, dispatch] = useReducer(explorerReducer, initialExplorerState);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Consentimento para carregar o player do YouTube: só nesta visita (spec 002 D3).
  const [playerConsent, setPlayerConsent] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [filters, setFilters] = useState<FilterValue>(EMPTY_FILTERS);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  // 0 até o primeiro carregamento: Date.now() não pode rodar no prerender (Cache Components).
  const [now, setNow] = useState(0);

  useEffect(() => {
    let active = true;
    void loadFirstPage(demoAllowed).then((action) => {
      if (!active) return;
      setNow(Date.now());
      dispatch(action);
    });
    return () => {
      active = false;
    };
  }, [demoAllowed]);

  // Relógio para o cooldown e tempos relativos. Rápido só durante o cooldown.
  const cooling = cooldownUntil > now;
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), cooling ? 1000 : 30_000);
    return () => window.clearInterval(id);
  }, [cooling]);

  const cooldownLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  function refresh() {
    if (cooldownUntil > Date.now()) return;
    const t = Date.now();
    setCooldownUntil(t + siteConfig.refreshCooldownSeconds * 1000);
    setNow(t);
    dispatch({ type: "refresh-start" });
    void loadFirstPage(demoAllowed).then((action) => {
      setNow(Date.now());
      dispatch(action);
    });
  }

  async function loadMore() {
    if (!state.next || state.loadingMore) return;
    dispatch({ type: "more-start" });
    const r = await requestLives(state.next);
    dispatch(r.ok ? { type: "more-loaded", payload: r.data } : { type: "more-failed", message: r.error.message });
  }

  const visible = useMemo(
    () => applyLiveFilters(state.items, { q: filters.q, lang: filters.lang, sort: filters.sort }),
    [state.items, filters],
  );
  const demo = state.meta?.source === "fixture";
  const selected = selectedId ? state.items.find((it) => it.videoId === selectedId) : undefined;

  function openPlayer(videoId: string) {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedId(videoId);
  }

  function closePlayer() {
    setSelectedId(null);
    // Devolve o foco ao botão que abriu o diálogo.
    triggerRef.current?.focus();
  }
  const filtered = filters.q.trim() !== "" || filters.lang !== "all";
  const err = state.error;

  return (
    <section id="lives" aria-labelledby="lives-title" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 id="lives-title" className="sr-only">
          Lives encontradas
        </h2>

        {demo && (
          <div className="mb-6 rounded-xl bg-accent-violet/10 p-4 ring-1 ring-accent-violet/50" role="note">
            <p className="text-sm font-semibold text-[#D7C2FF]">Dados simulados — não são lives reais</p>
            <p className="mt-1 text-sm text-text-secondary">
              Exibidos só em desenvolvimento. {state.notice}
            </p>
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

          <LiveFilters value={filters} onChange={setFilters} disabled={state.phase !== "ready"} />

          <p className="text-xs leading-relaxed text-text-secondary">
            {siteConfig.coverageNote} Idioma estimado a partir de metadados e título.
          </p>

          {state.meta?.stale && !err && (
            <div role="status" className="rounded-lg bg-surface-raised px-4 py-3 text-sm text-text-secondary ring-1 ring-accent-violet/40">
              O YouTube não respondeu agora. Mostrando resultados salvos da última consulta; algumas lives podem já ter
              terminado.
            </div>
          )}

          {state.phase === "ready" && err && (
            <div role="alert" className="rounded-lg bg-surface-raised px-4 py-3 text-sm text-text-secondary ring-1 ring-live-red/50">
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
              <EmptyState filtered={filtered && state.items.length > 0} onClear={() => setFilters(EMPTY_FILTERS)} />
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visible.map((item, i) => (
                  <li key={item.videoId}>
                    <LiveCard item={item} demo={demo} index={i} now={now} onWatchHere={() => openPlayer(item.videoId)} />
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
          key={selected.videoId}
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
