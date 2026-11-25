# 030 — Plano

## Passos

1. **`lib/twitch/status.ts`:**
   - `TWITCH_LOGIN` (D1);
   - `createTwitchStatusService({ client, cache, ttlMs })`, que consulta `helix("streams", { user_login, type: "live" })` e decide `live` ou `ended` (D2);
   - cache de 60 s, single-flight por canal e falha do store (D3).
2. **`lib/lives/providers/twitch.ts`:** capacidade `status` (`isValidId` e `getStatus`) quando houver serviço de status.
3. **`lib/lives/server.ts`:** serviço de status com `stores.cache("status:twitch")`, passado ao provedor.
4. **`tests/twitch-status.test.ts`:** serviço com cliente falso e handler real da rota com o provedor ativo e inativo.

## Arquivos

- **Novos:** `lib/twitch/status.ts`, `tests/twitch-status.test.ts`
- **Alterados:** `lib/lives/providers/twitch.ts`, `lib/lives/server.ts`

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`.
