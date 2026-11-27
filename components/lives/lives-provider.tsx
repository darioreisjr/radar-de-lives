"use client";

import { createContext, useContext, useEffect, useReducer, useState, type Dispatch, type ReactNode } from "react";
import { siteConfig } from "@/lib/config/site";
import {
  explorerReducer,
  initialExplorerState,
  type ApiError,
  type ExplorerAction,
  type ExplorerState,
} from "@/lib/lives/explorer-state";
import type { LivesErrorPayload, LivesPayload } from "@/lib/youtube/types";
import type { Platform } from "@/lib/lives/types";

export async function requestLives(
  pageToken?: string,
): Promise<{ ok: true; data: LivesPayload } | { ok: false; error: ApiError }> {
  try {
    const qs = pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : "";
    const res = await fetch(`/api/lives${qs}`, { cache: "no-store", headers: { Accept: "application/json" } });
    const body = (await res.json()) as LivesPayload | LivesErrorPayload;
    if (!res.ok || "error" in body) {
      const err = "error" in body ? body.error : { code: "upstream_unavailable" as const, message: "Resposta inesperada" };
      return { ok: false, error: err };
    }
    return { ok: true, data: body };
  } catch {
    return { ok: false, error: { code: "network", message: "Sem conexão com o servidor. Verifique sua internet e tente novamente." } };
  }
}

/** Primeira página. Sem chave e fora de produção, carrega fixtures rotuladas (001 D15). */
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
        demo: true,
      },
    };
  }
  return { type: "failed", error: r.error };
}

interface LivesContextValue {
  state: ExplorerState;
  dispatch: Dispatch<ExplorerAction>;
  demoAllowed: boolean;
  demo: boolean;
  /** Relógio da página (0 até o primeiro carregamento). */
  now: number;
  cooldownLeft: number;
  refresh: () => void;
  loadMore: () => Promise<void>;
  /** Plataformas ativas no servidor (spec 034). */
  platforms: readonly Platform[];
}

const LivesContext = createContext<LivesContextValue | null>(null);

/** Estado das lives compartilhado entre o hero (painel do radar) e a grade (spec 007 D4). */
export function LivesProvider({
  demoAllowed,
  platforms = ["youtube"],
  children,
}: {
  demoAllowed: boolean;
  /** Plataformas ativas, calculadas no servidor (spec 034). Valem mesmo antes de a API responder. */
  platforms?: readonly Platform[];
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(explorerReducer, initialExplorerState);
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

  const value: LivesContextValue = {
    state,
    dispatch,
    demoAllowed,
    platforms,
    demo: state.meta?.demo === true,
    now,
    cooldownLeft: Math.max(0, Math.ceil((cooldownUntil - now) / 1000)),
    refresh,
    loadMore,
  };
  return <LivesContext.Provider value={value}>{children}</LivesContext.Provider>;
}

export function useLives(): LivesContextValue {
  const ctx = useContext(LivesContext);
  if (!ctx) throw new Error("useLives precisa estar dentro de <LivesProvider>");
  return ctx;
}
