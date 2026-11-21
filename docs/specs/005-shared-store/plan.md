# 005 — Plano técnico

## Módulos

- `lib/store/types.ts`: `Counter`, `Lock`, `StoreError`; reexporta `CacheStore`.
- `lib/store/memory.ts`: `MemoryCounter`, `MemoryLock` (o `MemoryCache` existente continua).
- `lib/store/redis-like.ts`: interface mínima `RedisLike` (`get`, `set` com `nx/px`, `incr`) + `fromUpstash(redis)`.
- `lib/store/upstash.ts`: `UpstashCache`, `UpstashCounter`, `UpstashLock` sobre `RedisLike`; erros viram `StoreError`.
- `lib/store/index.ts`: `createStores(env)` escolhe Upstash ou memória (D1, D8).
- `lib/youtube/daily-budget.ts`: `createDailyBudget(limit, counter, method, now)` assíncrono (`consume() → { ok, used }`).
- `lib/rate-limit/rate-limiter.ts`: `createRateLimiter({ counter, limit, windowMs, secret })` assíncrono com HMAC (D5); remove `memory-rate-limit.ts`.
- `lib/youtube/service.ts`: trava (D3) no lugar de `lastUpstreamAt`; orçamento assíncrono; falha fechada (D6).
- `lib/youtube/video-status.ts`: orçamento assíncrono; falha fechada.
- `lib/lives/server.ts`: usa `createStores`; rotas aguardam `check()`.
- `lib/config/server-env.ts`: `upstashUrl`, `upstashToken`, `rateLimitSecret`.
- `lib/telemetry.ts`: eventos `store_error`, `store_memory_in_production`.

## Testes

`tests/store.test.ts` (fake `RedisLike` em memória com TTL controlado) e ajustes em `service`, `video-status`, `telemetry`.

## Documentação

`.env.example`, README (deploy na Vercel), `/privacy` (Upstash e hash do IP), CLAUDE.md.

## Rollback

Remover as variáveis Upstash volta ao modo memória sem mudar código.
