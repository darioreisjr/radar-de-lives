# 048 — Plano

1. **`lib/config/server-env.ts`:** `kickCacheTtlSeconds` (180, 30–3600) e `kickStaleTtlSeconds` (600, 0–3600). (D2)
2. **`lib/telemetry.ts`:** evento `kick_call`. (D6)
3. **`lib/kick/service.ts`:** `createKickLivesService({ search, cache, lock, config })` com o desenho do serviço da Twitch. (D1, D3, D4)
4. **`lib/lives/providers/kick.ts`:** `createKickProvider(service)` com `KICK_TIMEOUT_MS` = 12 s e `withIdentity`. (D5)
5. **`lib/lives/server.ts`:** cliente da Kick a partir do ambiente, serviço com `searchKickLives` e `lives:kick`, candidato `kick` em `activeProviders`; variáveis da Kick na assinatura do runtime.
6. **`lib/lives/active-platforms.ts`:** candidato `kick` com `isKickConfigured`. (D7, ampliação)
7. **`.env.example`:** variáveis da Kick. (D8, ampliação)
8. **Testes:** `tests/kick-service.test.ts` (CA1 a CA6, incluindo seleção por `LIVES_PROVIDERS`, single-flight, cache vencido, falha sem cache, trava, store fora, quota do YouTube); `tests/copy.test.ts` não muda (`active-platforms` com Kick coberto em `kick-service.test.ts`).

## Arquivos

- **Novos:** `lib/kick/service.ts`, `lib/lives/providers/kick.ts`, `tests/kick-service.test.ts`, `docs/specs/048-kick-service/*`
- **Alterados:** `lib/config/server-env.ts`, `lib/telemetry.ts`, `lib/lives/server.ts`
- **Ampliação a confirmar:** `lib/lives/active-platforms.ts`, `.env.example`

`lib/lives/aggregator.ts` não precisa mudar: já trata qualquer `LivesProvider`.

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`. Teste local com credenciais reais só se o responsável autorizar.
