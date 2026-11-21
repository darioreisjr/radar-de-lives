/** Rate limit de janela fixa por chave (IP). Memória do processo; não compartilhado entre instâncias. */
export class FixedWindowRateLimit {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string): { ok: true } | { ok: false; retryAfterSeconds: number } {
    const t = this.now();
    if (this.hits.size > 5000) {
      for (const [k, v] of this.hits) if (v.resetAt <= t) this.hits.delete(k);
    }
    const cur = this.hits.get(key);
    if (!cur || cur.resetAt <= t) {
      this.hits.set(key, { count: 1, resetAt: t + this.windowMs });
      return { ok: true };
    }
    if (cur.count >= this.limit) {
      return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((cur.resetAt - t) / 1000)) };
    }
    cur.count += 1;
    return { ok: true };
  }
}
