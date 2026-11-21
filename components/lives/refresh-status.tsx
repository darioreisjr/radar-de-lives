"use client";

import { Button } from "@/components/ui/button";
import { formatClock } from "@/lib/utils/format";

export function RefreshStatus({
  loading,
  unavailable,
  refreshing,
  total,
  visible,
  updatedAt,
  cached,
  demo,
  cooldownLeft,
  onRefresh,
}: {
  loading: boolean;
  /** Nenhuma consulta concluída (erro sem resultados): não mostrar "0 lives encontradas". */
  unavailable: boolean;
  refreshing: boolean;
  total: number;
  visible: number;
  updatedAt: string | null;
  cached: boolean;
  demo: boolean;
  cooldownLeft: number;
  onRefresh: () => void;
}) {
  const summary = loading
    ? "Buscando lives…"
    : unavailable
      ? "Busca indisponível"
      : visible === total
      ? `${total} ${total === 1 ? "live encontrada" : "lives encontradas"}`
      : `${visible} de ${total} lives encontradas`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-display text-2xl font-semibold uppercase tracking-wide" aria-live="polite" aria-atomic="true">
          {summary}
        </p>
        <p className="mt-1 font-mono text-xs text-text-secondary">
          {updatedAt ? (
            <>
              {demo ? "Dados simulados gerados às " : "Atualizado às "}
              <time dateTime={updatedAt} className="text-accent-cyan">
                {formatClock(updatedAt)}
              </time>
              {!demo && (cached ? " · do cache" : " · consulta nova")}
            </>
          ) : (
            "Aguardando primeira consulta"
          )}
        </p>
      </div>
      <Button
        onClick={onRefresh}
        disabled={loading || refreshing || cooldownLeft > 0}
        aria-describedby={cooldownLeft > 0 ? "refresh-cooldown" : undefined}
        className="self-start sm:self-auto"
      >
        <svg
          viewBox="0 0 16 16"
          className={`size-4 ${refreshing ? "animate-spin" : ""}`}
          aria-hidden="true"
        >
          <path
            d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {refreshing ? "Atualizando…" : "Atualizar"}
        {cooldownLeft > 0 && !refreshing && (
          <span id="refresh-cooldown" className="font-mono text-xs text-text-secondary">
            <span className="sr-only">disponível em </span>
            {cooldownLeft}s
          </span>
        )}
      </Button>
    </div>
  );
}
