# 036 — Plano

## Passos

1. **`lib/store/upstash.ts`:** `storeKeyPrefix(vercelEnv)` e `withKeyPrefix(redis, prefix)`. (D1, D2, D3)
2. **`lib/store/index.ts`:** `createStores` envolve o cliente do Upstash com o prefixo de `process.env.VERCEL_ENV`.
3. **`tests/store.test.ts`:** prefixo por ambiente; cache, contador e trava do Preview separados da produção; sem prefixo, o mesmo cliente.

## Arquivos

- **Alterados:** `lib/store/upstash.ts`, `lib/store/index.ts`, `tests/store.test.ts`

## Publicação

Merge → deploy em produção (chaves iguais). O primeiro Preview novo começa com cache vazio no seu prefixo.

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`. Depois do deploy: abrir o Preview do PR e conferir que `/api/lives` da produção segue com até 100 lives da Twitch.
