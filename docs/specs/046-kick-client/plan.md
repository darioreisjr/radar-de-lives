# 046 — Plano

1. **`lib/config/server-env.ts`:** `kickClientId`, `kickClientSecret`, `kickCategoryId` (padrão `13155`). (D6)
2. **`lib/telemetry.ts`:** eventos `kick_token` e `kick_error`; `kick_error` como aviso. (D5)
3. **`lib/kick/client.ts`** (`server-only`): `createKickClient` com token em memória e single-flight, margem de 5 min, `api(path, params, schema)` com timeout, nova tentativa para rede/`5xx`, `401` → token novo uma vez, `429` → `rate_limited`; `isKickConfigured` e `createKickClientFromEnv`. (D1 a D4, D7)
4. **`tests/kick-client.test.ts`:** CA1 a CA6 com `fetch` falso e relógio controlado; resposta no formato da fixture `tests/fixtures/kick/livestreams-v2.json`.

## Arquivos

- **Novos:** `lib/kick/client.ts`, `tests/kick-client.test.ts`
- **Alterados:** `lib/config/server-env.ts`, `lib/telemetry.ts`

`lib/kick/errors.ts` não é necessário: reaproveita `LivesError`. O CI já tem a checagem do bundle para a Kick (spec 027).

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e checagem do bundle (`.next/static` sem `id.kick.com/oauth` nem `KICK_CLIENT_SECRET`).
