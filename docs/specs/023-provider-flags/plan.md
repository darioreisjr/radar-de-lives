# 023 — Plano

## Passos

1. **`lib/lives/providers/select.ts`** (novo, puro):
   - `parseProviderList(raw)` → `{ platforms, ignored }` (R1 a R3);
   - `selectProviders(platforms, candidates)` → `{ providers, disabled }` (R4 a R7).
2. **`lib/config/server-env.ts`:** expõe `livesProviders` (texto bruto de `LIVES_PROVIDERS`).
3. **`lib/lives/server.ts`:**
   - monta os candidatos (por enquanto, só o YouTube);
   - aplica a seleção;
   - registra `config_warning` e `provider_disabled`;
   - inclui `livesProviders` na assinatura do runtime.
4. **`lib/telemetry.ts`:** eventos `config_warning` e `provider_disabled` (warn).
5. **`.env.example`:** documenta `LIVES_PROVIDERS`.
6. **`tests/provider-select.test.ts`** (novo): CA1 a CA5.

## Arquivos

- **Novos:** `lib/lives/providers/select.ts`, `tests/provider-select.test.ts`
- **Alterados:** `lib/config/server-env.ts`, `lib/lives/server.ts`, `lib/telemetry.ts`, `.env.example`

`lib/lives/aggregator.ts` não precisa mudar: ele recebe a lista já selecionada. O módulo `select.ts` é novo e fica fora de `server-only` (D2). Essa necessidade está registrada aqui em relação à lista da issue.

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`.
