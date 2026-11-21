import type { Counter } from "@/lib/store/types";

/** Dia corrente no fuso da quota do YouTube (reset à meia-noite PT). */
export function quotaDay(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(ms);
}

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Orçamento diário por método (spec 005 D4). Com Upstash, é único para todas as instâncias.
 * Erros do store propagam (StoreError): quem chama decide falhar fechado.
 */
export function createDailyBudget(opts: {
  limit: number;
  counter: Counter;
  method: string;
  now?: () => number;
}) {
  const now = opts.now ?? Date.now;
  return {
    async consume(): Promise<{ ok: boolean; used: number }> {
      const used = await opts.counter.incr(`budget:${opts.method}:${quotaDay(now())}`, TWO_DAYS_MS);
      return { ok: used <= opts.limit, used: Math.min(used, opts.limit) };
    },
    limit: opts.limit,
  };
}

export type DailyBudget = ReturnType<typeof createDailyBudget>;
