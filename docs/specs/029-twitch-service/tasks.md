# 029 — Tarefas

- [x] `lib/twitch/service.ts`: cache, single-flight, trava entre instâncias, cache vencido e falha do store. (D1 a D4; CA3, CA4)
- [x] `lib/lives/providers/twitch.ts` com `timeoutMs` de 12 s. (D5)
- [x] `TWITCH_CACHE_TTL_SECONDS` e `TWITCH_STALE_TTL_SECONDS` com limites de no máximo 2 h no total. (D1, CA7)
- [x] `server.ts`: candidato `twitch` sempre presente, ativo só com credenciais e com `twitch` em `LIVES_PROVIDERS`; assinatura do runtime atualizada. (D6, D7; CA1)
- [x] Telemetria `twitch_call`; `stale_served` e `store_error` com `platform: "twitch"`.
- [x] `tests/twitch-service.test.ts`: 13 testes. (CA1 a CA7)
- [x] Verificação em 2026-11-25:
  - lint e typecheck: ok;
  - `npm test`: 23 arquivos, 228 testes;
  - build e `npm run test:e2e`: 56 testes;
  - bundle do cliente limpo;
  - **Servidor real** (`next start`, sem credenciais, `LIVES_PROVIDERS=youtube,twitch`):
    - `/api/lives` → `503 missing_api_key`, igual a hoje;
    - log `provider_disabled {platform: "twitch", reason: "not_configured"}`.
- [ ] Opcional antes da #47: teste local com as credenciais reais da Twitch (feito pelo responsável).
