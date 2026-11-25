# 029 — Plano

## Passos

1. **`lib/twitch/service.ts`:** `createTwitchLivesService({ search, cache, lock, config })` com:
   - cache fresco;
   - single-flight;
   - trava entre instâncias, com espera pelo cache de outra instância;
   - busca, gravação no cache e log `twitch_call`;
   - cache vencido em falha (log `stale_served` com `platform`);
   - falha do store fechando sem chamar a Twitch.
2. **`lib/lives/providers/twitch.ts`:** `createTwitchProvider(service | null)`.
   - `isConfigured()` = existe serviço;
   - `timeoutMs` = 12 s.
3. **`lib/config/server-env.ts`:** `twitchCacheTtlSeconds` (180; 30 a 3.600) e `twitchStaleTtlSeconds` (600; 0 a 3.600).
4. **`lib/lives/server.ts`:**
   - cliente pelas variáveis de ambiente;
   - serviço com `stores.cache("lives:twitch")` e `stores.lock`;
   - candidato `twitch` em `selectProviders`;
   - variáveis da Twitch na assinatura.
5. **`lib/telemetry.ts`:** `twitch_call`.
6. **Testes** (`tests/twitch-service.test.ts`): serviço sozinho e agregador com YouTube falso e Twitch real sobre busca falsa.

## Arquivos

- **Novos:** `lib/twitch/service.ts`, `lib/lives/providers/twitch.ts`, `tests/twitch-service.test.ts`
- **Alterados:** `lib/config/server-env.ts`, `lib/lives/server.ts`, `lib/telemetry.ts`

`lib/lives/aggregator.ts` não mudou: o contrato da spec 022 bastou.

## Verificação

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`.
- Servidor real com `LIVES_PROVIDERS=youtube,twitch` e sem credenciais.
