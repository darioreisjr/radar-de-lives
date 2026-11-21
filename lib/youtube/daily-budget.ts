/** Dia corrente no fuso da quota do YouTube (reset à meia-noite PT). */
export function quotaDay(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(ms);
}

/** Contador diário em memória do processo (não compartilhado entre instâncias). */
export function createDailyBudget(limit: number, now: () => number = Date.now) {
  let day = "";
  let used = 0;
  return {
    /** Consome 1 unidade; false se o orçamento do dia acabou. */
    consume(): boolean {
      const today = quotaDay(now());
      if (today !== day) {
        day = today;
        used = 0;
      }
      if (used >= limit) return false;
      used += 1;
      return true;
    },
    used: () => used,
  };
}
