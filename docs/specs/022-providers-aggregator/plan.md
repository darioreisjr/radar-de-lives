# 022 — Plano

## Abordagem

1. **Tipos:** `lib/lives/types.ts` ganha `SourceStatus` e o campo `sources?` em `LivesPayload`.
2. **Contrato:** `lib/lives/providers/types.ts` com:
   - `LivesProvider`: `platform`, `isConfigured()`, `timeoutMs?` e `getLives({ pageToken })`;
   - `ProviderResult`: `items`, `updatedAt`, `cached`, `stale` e `nextPageToken`.
3. **Adaptador do YouTube** (`lib/lives/providers/youtube.ts`): chama `LivesService.getLives(pageToken)` e aplica `withIdentity` aos itens (D8).
4. **Agregador** (`lib/lives/aggregator.ts`):
   - `createLivesAggregator({ providers, log })` devolve `getLives(pageToken?)`;
   - `pageToken` → só o YouTube (D4);
   - `Promise.allSettled` com `withTimeout` opcional (D2);
   - nenhum provedor respondeu → relança o erro do YouTube ou o primeiro (D5);
   - senão: intercala (D3), deduplica por `id` e calcula os metadados (D7) e `sources` (D6);
   - falhas geram `provider_failed` (`platform` e `code`).
5. **Servidor:** `lib/lives/server.ts` monta o agregador com `[youtubeProvider]` e exporta `getLivesAggregator()`.
6. **Rota:** `app/api/lives/route.ts` usa o agregador e devolve `sources`.
7. **Telemetria:** `lib/telemetry.ts` ganha `provider_failed` (nível warn).
8. **Testes** (`tests/aggregator.test.ts`): CA1 a CA8, com provedores falsos e com o serviço real do YouTube sobre `fetch` falso e `MemoryCache` (vazio, válido e com itens antigos).

## Arquivos

- **Novos:** `lib/lives/providers/types.ts`, `lib/lives/providers/youtube.ts`, `lib/lives/aggregator.ts`, `tests/aggregator.test.ts`
- **Alterados:** `lib/lives/types.ts`, `lib/lives/server.ts`, `app/api/lives/route.ts`, `lib/telemetry.ts`, `tests/telemetry.test.ts` (se precisar)

`components/lives/lives-provider.tsx` não precisa mudar, porque `sources` é opcional (D9).

## Verificação

`npm run lint`, `npm run typecheck`, `npm test` (snapshot de caracterização inalterado), `npm run build` e `npm run test:e2e`.

## Deploy e rollback

- O cache não muda de chave (D1), então o deploy não invalida nada. Logo depois do deploy, conferir `/api/lives`:
  - `sources` com só o YouTube;
  - os mesmos itens.
- **Rollback:** reverter o PR.
