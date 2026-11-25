"use client";

import { platformMeta } from "@/lib/lives/platforms";
import type { LangFilter, Platform, SortOption } from "@/lib/lives/types";

const field =
  "min-h-11 w-full rounded-lg bg-surface px-3 text-sm text-text-primary ring-1 ring-border-strong placeholder:text-text-secondary/80 transition-shadow duration-[140ms] hover:ring-accent-cyan/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan";
const label = "mb-2 block text-sm text-text-secondary";

export interface FilterValue {
  q: string;
  lang: LangFilter;
  sort: SortOption;
  /** Só aparece com 2 ou mais plataformas ativas (spec 026). */
  platform: Platform | "all";
}

export function LiveFilters({
  value,
  onChange,
  disabled,
  platforms = [],
}: {
  value: FilterValue;
  onChange: (next: FilterValue) => void;
  disabled?: boolean;
  /** Plataformas ativas. O filtro só aparece com 2 ou mais (spec 026 D2). */
  platforms?: readonly Platform[];
}) {
  const multi = platforms.length > 1;
  return (
    <form
      role="search"
      aria-label="Filtrar lives encontradas"
      className={`grid gap-3 ${multi ? "sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]" : "sm:grid-cols-[minmax(0,1fr)_auto_auto]"}`}
      onSubmit={(e) => e.preventDefault()}
    >
      <div>
        <label htmlFor="filter-q" className={label}>
          Buscar nos resultados
        </label>
        <input
          id="filter-q"
          type="search"
          inputMode="search"
          maxLength={80}
          autoComplete="off"
          placeholder="Título ou canal"
          value={value.q}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          className={field}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:contents">
        {multi && (
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="filter-platform" className={label}>
              Plataforma
            </label>
            <select
              id="filter-platform"
              value={value.platform}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, platform: e.target.value as Platform | "all" })}
              className={`${field} sm:w-40`}
            >
              <option value="all">Todas</option>
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {platformMeta(p).label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="filter-lang" className={label}>
            Idioma (estimado)
          </label>
          <select
            id="filter-lang"
            value={value.lang}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, lang: e.target.value as LangFilter })}
            className={`${field} sm:w-44`}
          >
            <option value="all">Todos</option>
            <option value="pt">Português</option>
            <option value="en">Inglês</option>
            <option value="es">Espanhol</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-sort" className={label}>
            Ordenar por
          </label>
          <select
            id="filter-sort"
            value={value.sort}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, sort: e.target.value as SortOption })}
            className={`${field} sm:w-44`}
          >
            <option value="relevance">Relevância</option>
            <option value="viewers">Espectadores</option>
            <option value="recent">Mais recentes</option>
          </select>
        </div>
      </div>
    </form>
  );
}
