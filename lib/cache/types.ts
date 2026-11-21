export interface CacheEntry<T> {
  value: T;
  /** epoch ms do momento em que o valor foi obtido do provedor. */
  storedAt: number;
}

/**
 * Interface de cache para resultados da busca.
 * Implementação atual: memória (desenvolvimento / instância única).
 * Produção com várias instâncias: implementar esta interface com um cache
 * compartilhado (ex.: Redis) — decisão de infraestrutura pendente (spec 001 §11).
 */
export interface CacheStore<T> {
  get(key: string): Promise<CacheEntry<T> | undefined>;
  set(key: string, entry: CacheEntry<T>, maxAgeMs: number): Promise<void>;
}
