import { dedupeById, withIdentity } from "@/lib/lives/identity";
import type { LiveItem, LivesErrorCode, LivesPayload } from "@/lib/lives/types";
import type { VideoStatusPayload } from "@/lib/youtube/types";

export type ApiError = { code: LivesErrorCode | "network"; message: string };
export type Meta = Pick<LivesPayload, "updatedAt" | "cached" | "stale" | "source">;

export interface ExplorerState {
  phase: "loading" | "ready" | "error";
  refreshing: boolean;
  items: LiveItem[];
  next: string | null;
  meta: Meta | null;
  error: ApiError | null;
  notice: string | null;
  loadingMore: boolean;
  moreError: string | null;
}

export type ExplorerAction =
  | { type: "loaded"; payload: LivesPayload; notice?: string }
  | { type: "failed"; error: ApiError }
  | { type: "refresh-start" }
  | { type: "more-start" }
  | { type: "more-loaded"; payload: LivesPayload }
  | { type: "more-failed"; message: string }
  /** Resultado da revalidação ao abrir o player (spec 002 RF8). */
  | { type: "item-status"; status: VideoStatusPayload };

export const initialExplorerState: ExplorerState = {
  phase: "loading",
  refreshing: false,
  items: [],
  next: null,
  meta: null,
  error: null,
  notice: null,
  loadingMore: false,
  moreError: null,
};

export function explorerReducer(s: ExplorerState, a: ExplorerAction): ExplorerState {
  switch (a.type) {
    case "refresh-start":
      return { ...s, refreshing: true, moreError: null };
    case "loaded":
      return {
        ...s,
        phase: "ready",
        refreshing: false,
        items: dedupeById(a.payload.items.map(withIdentity)),
        next: a.payload.nextPageToken,
        meta: { updatedAt: a.payload.updatedAt, cached: a.payload.cached, stale: a.payload.stale, source: a.payload.source },
        error: null,
        notice: a.notice ?? null,
        moreError: null,
      };
    case "failed":
      // Com itens já exibidos, mantém a grade e mostra aviso (não apaga o que foi encontrado).
      return { ...s, phase: s.items.length ? "ready" : "error", refreshing: false, error: a.error };
    case "more-start":
      return { ...s, loadingMore: true, moreError: null };
    case "more-loaded": {
      // Mantém a ordem de relevância global: páginas seguintes vêm depois.
      const offset = s.items.reduce((m, it) => Math.max(m, it.rank), -1) + 1;
      const appended = a.payload.items.map((it) => ({ ...withIdentity(it), rank: it.rank + offset }));
      return {
        ...s,
        loadingMore: false,
        items: dedupeById([...s.items, ...appended]),
        next: a.payload.nextPageToken,
      };
    }
    case "more-failed":
      return { ...s, loadingMore: false, moreError: a.message };
    case "item-status": {
      const st = a.status;
      return {
        ...s,
        items: s.items.map((it) =>
          // O status ainda vem da rota do YouTube (/api/lives/[videoId]); a #36 generaliza.
          it.platform !== "youtube" || it.sourceId !== st.videoId
            ? it
            : {
                ...it,
                isLive: st.state === "live",
                // Só substitui a audiência quando há valor novo; nunca inventa.
                concurrentViewers: st.state === "live" ? (st.concurrentViewers ?? it.concurrentViewers) : null,
                embedAllowed: st.embedAllowed === "unknown" ? it.embedAllowed : st.embedAllowed,
              },
        ),
      };
    }
  }
}
