# 048 — Tarefas

- [x] `server-env`: `kickCacheTtlSeconds` (180, 30–3600) e `kickStaleTtlSeconds` (600, 0–3600). (D2)
- [x] `telemetry`: `kick_call`. (D6)
- [x] `lib/kick/service.ts`: cache `lives:kick`, cache vencido em falha (com `stale_served`), trava entre instâncias, espera pelo cache de outra instância, single-flight, store fora → fecha sem chamar a Kick. (D1, D3, D4)
- [x] `lib/lives/providers/kick.ts`: timeout de 12 s, `withIdentity`, sem `status` até a #51. (D5)
- [x] `lib/lives/server.ts`: cliente, serviço e candidato `kick`; variáveis da Kick na assinatura do runtime.
- [x] **Ampliação** `lib/lives/active-platforms.ts`: candidato `kick` com credenciais. (D7)
- [x] **Ampliação** `.env.example`: variáveis da Kick. (D8)
- [x] `tests/kick-service.test.ts` (15 testes): TTL e cache; CA3 single-flight; CA4 cache vencido (também em `429`); erro sem cache; trava de outra instância; store fora; CA1 seleção (sem `kick` na lista e sem credenciais); CA2/CA6 intercalação e YouTube chamado uma vez; três plataformas; CA4/CA5 em `sources`; timeout; limites do cache; plataformas ativas para os textos.
- [x] Verificação em 2026-11-27:
  - lint e typecheck: ok;
  - `npm test`: 30 arquivos, 308 testes;
  - `npm run test:e2e`: 72 testes (padrão só YouTube: nada muda);
  - bundle do cliente sem segredos da Twitch ou da Kick;
  - **build real** com `LIVES_PROVIDERS=youtube,kick` e credenciais falsas: metadata "ao vivo no YouTube e na Kick", texto da OG "encontradas no YouTube e na Kick" e nota de cobertura com "da API da Kick" (D7). Build padrão refeito depois.
- Não feito: teste local com credenciais reais (depende de autorização; a Kick só entra em produção na #55).
