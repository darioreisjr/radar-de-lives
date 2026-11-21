import type { Counter, Lock } from "./types";

/** Contador em memória do processo (desenvolvimento / instância única). */
export class MemoryCounter implements Counter {
  private map = new Map<string, { value: number; expiresAt: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  async incr(key: string, ttlMs: number) {
    const t = this.now();
    if (this.map.size > 5000) for (const [k, v] of this.map) if (v.expiresAt <= t) this.map.delete(k);
    const cur = this.map.get(key);
    if (!cur || cur.expiresAt <= t) {
      this.map.set(key, { value: 1, expiresAt: t + ttlMs });
      return 1;
    }
    cur.value += 1;
    return cur.value;
  }
}

/** Trava em memória do processo. */
export class MemoryLock implements Lock {
  private map = new Map<string, number>();

  constructor(private readonly now: () => number = Date.now) {}

  async acquire(key: string, ttlMs: number) {
    const t = this.now();
    const until = this.map.get(key);
    if (until !== undefined && until > t) return false;
    this.map.set(key, t + ttlMs);
    return true;
  }
}
