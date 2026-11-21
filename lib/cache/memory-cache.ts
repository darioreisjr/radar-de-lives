import type { CacheEntry, CacheStore } from "./types";

/** Cache em memória do processo. Limita entradas para não crescer sem controle. */
export class MemoryCache<T> implements CacheStore<T> {
  private map = new Map<string, { entry: CacheEntry<T>; expiresAt: number }>();

  constructor(
    private readonly maxEntries = 50,
    private readonly now: () => number = Date.now,
  ) {}

  async get(key: string) {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= this.now()) {
      this.map.delete(key);
      return undefined;
    }
    return hit.entry;
  }

  async set(key: string, entry: CacheEntry<T>, maxAgeMs: number) {
    this.map.delete(key);
    this.map.set(key, { entry, expiresAt: this.now() + maxAgeMs });
    while (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }
}
