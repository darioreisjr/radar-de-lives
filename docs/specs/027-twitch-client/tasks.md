# 027 — Tarefas

- [x] Variáveis `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` e `TWITCH_GAME_ID` em `server-env.ts` e `.env.example`. (D6)
- [x] `lib/twitch/client.ts`:
  - token em memória com single-flight;
  - renovação com margem de 5 min;
  - validação horária;
  - `helix()` com o mapeamento de erros e o schema Zod;
  - `rateLimit()`. (D1 a D4; CA2 a CA4)
- [x] Telemetria `twitch_token` e `twitch_error`, só com `stage`, `status` e `code`. (D5, CA5)
- [x] Passo de CI "Bundle do cliente sem credenciais". (CA6)
- [x] `tests/twitch-client.test.ts`: 14 testes. (CA1 a CA6)
- [x] Verificação em 2026-11-25:
  - lint e typecheck: ok;
  - `npm test`: 21 arquivos, 201 testes;
  - build: ok;
  - `npm run test:e2e`: 56 testes;
  - **checagem do bundle:** limpo; com um arquivo contaminado plantado em `.next/static`, a mesma checagem **detectou** (arquivo removido depois).
