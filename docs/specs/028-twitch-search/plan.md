# 028 — Plano

## Passos

1. **`lib/twitch/types.ts`:** schemas Zod.
   - `TwitchStreamSchema`: item a item (D6);
   - `TwitchStreamsPageSchema`: página com itens ainda não validados;
   - `TwitchChannelsSchema`: rótulos de classificação.
2. **`lib/twitch/normalize.ts`:**
   - `normalizeStream`;
   - `twitchThumbnail`, `twitchLanguage` e `twitchViewers`;
   - `ADULT_LABELS` e `isAdult` (D1).
3. **`lib/twitch/search.ts`** (`server-only`):
   - `searchTwitchLives(client, { gameId, languages, maxPages })`;
   - até 3 páginas, com dedupe por `id` e itens inválidos contados;
   - `/helix/channels` em lotes de 100, com falha tolerada (D4).
4. **`tests/twitch-normalize.test.ts`:** contrato com a fixture real, normalização e busca com cliente falso (o `helix()` real valida com os schemas).

## Arquivos

- **Novos:** `lib/twitch/types.ts`, `lib/twitch/normalize.ts`, `lib/twitch/search.ts`, `tests/twitch-normalize.test.ts`
- **Fixture usada:** `tests/fixtures/twitch/streams.json` (do spike 019, sem mudança).

## Custo por atualização (para a #41)

- **Comum:** 1 chamada a `/helix/streams` + 1 a `/helix/channels` = **2 pontos**.
- **Máximo:** 3 + 3 = 6 pontos, contra 800 por minuto.

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`.
