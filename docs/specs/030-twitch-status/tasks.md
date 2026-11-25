# 030 — Tarefas

- [x] `lib/twitch/status.ts`: validação do login, `live` ou `ended`, cache de 60 s, single-flight e falha do store. (D1 a D3; CA1 a CA4)
- [x] Capacidade `status` no provedor da Twitch e ligação no `server.ts`. (CA5)
- [x] `tests/twitch-status.test.ts`: 7 testes, incluindo o handler real da rota com a Twitch ativa e inativa.
- [x] Verificação em 2026-11-25:
  - lint e typecheck: ok;
  - `npm test`: 24 arquivos, 235 testes;
  - build e `npm run test:e2e`: 56 testes;
  - bundle do cliente limpo.
