export type { CacheEntry, CacheStore } from "@/lib/cache/types";

/** Contador com expiração (janela fixa / orçamento diário). */
export interface Counter {
  /** Incrementa e devolve o novo valor. O TTL vale a partir do primeiro incremento. */
  incr(key: string, ttlMs: number): Promise<number>;
}

/** Trava com expiração, compartilhada entre instâncias quando o store é remoto. */
export interface Lock {
  /** true se esta chamada obteve a trava (ela expira sozinha após ttlMs). */
  acquire(key: string, ttlMs: number): Promise<boolean>;
}

/** Falha do armazenamento (rede, credencial, limite do provedor). */
export class StoreError extends Error {
  constructor(readonly operation: string) {
    super(`store ${operation} failed`);
    this.name = "StoreError";
  }
}
