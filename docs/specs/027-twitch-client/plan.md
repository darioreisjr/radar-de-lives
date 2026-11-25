# 027 — Plano

## Passos

1. **`lib/config/server-env.ts`:** `twitchClientId`, `twitchClientSecret` e `twitchGameId` (padrão `1867279146`, só dígitos).
2. **`lib/twitch/client.ts`** (`server-only`):
   - `createTwitchClient`:
     - token em memória com single-flight;
     - renovação com margem de 5 min;
     - validação horária;
     - `helix(path, params, schema)` com timeout de 8 s, 1 nova tentativa para rede e `5xx`, `401` → token novo e 1 nova tentativa, `429` → `rate_limited`, erros `4xx` → `upstream_config`, schema Zod;
     - `rateLimit()` com os últimos cabeçalhos;
   - `isTwitchConfigured` e `createTwitchClientFromEnv` (D6).
3. **`lib/telemetry.ts`:** `twitch_token` e `twitch_error` (D5).
4. **CI** (`.github/workflows/ci.yml`): depois do build, falha se `.next/static` contiver `id.twitch.tv/oauth2`, `TWITCH_CLIENT_SECRET`, `id.kick.com/oauth` ou `KICK_CLIENT_SECRET`.
5. **`.env.example`:** variáveis da Twitch.
6. **`tests/twitch-client.test.ts`:** CA1 a CA6, com `fetch` falso e relógio controlado.

## Arquivos

- **Novos:** `lib/twitch/client.ts`, `tests/twitch-client.test.ts`
- **Alterados:** `lib/config/server-env.ts`, `lib/telemetry.ts`, `.github/workflows/ci.yml`, `.env.example`

`lib/twitch/errors.ts` não foi necessário: o cliente reaproveita `LivesError`.

## Verificação

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`.
- Checagem do bundle feita localmente, inclusive com um vazamento simulado, para provar que ela detecta.
