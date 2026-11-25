# 023 — Tarefas

- [x] `lib/lives/providers/select.ts`: `parseProviderList` (R1 a R3) e `selectProviders` (R4 a R7). (CA1 a CA5)
- [x] `server-env.ts` expõe `livesProviders`; `server.ts` aplica a seleção, registra `config_warning` e `provider_disabled` e inclui a variável na assinatura do runtime. (D2, D3)
- [x] Telemetria: `config_warning` (só a quantidade ignorada) e `provider_disabled` (`platform` e `reason`), nível warn.
- [x] `.env.example` documenta `LIVES_PROVIDERS`.
- [x] `tests/provider-select.test.ts`: 10 testes. (CA1 a CA5)
- [x] Verificação em 2026-11-25:
  - lint e typecheck: ok;
  - `npm test`: 18 arquivos, 168 testes;
  - build e `npm run test:e2e`: 46 testes;
  - **Servidor real** (`next start`, sem `YOUTUBE_API_KEY`, `LIVES_PROVIDERS=youtube,foo,twitch`):
    - `GET /api/lives` → `503 missing_api_key`, igual a hoje (R5);
    - log `config_warning {variable: "LIVES_PROVIDERS", ignored: 1}`, sem o texto ignorado;
    - log `provider_disabled {platform: "twitch", reason: "not_implemented"}`.
