# 036 — Tarefas

- [x] Diagnóstico pelos logs da Vercel: o Preview antigo `git-sprint-033-twitch-legal` gravou 293 lives em `lives:twitch` às 20:04 UTC, no Redis da produção.
- [x] `storeKeyPrefix` e `withKeyPrefix` em `lib/store/upstash.ts`. (D1 a D3)
- [x] `createStores` aplica o prefixo de `VERCEL_ENV`.
- [x] `tests/store.test.ts`: 3 testes. (CA1, CA2)
- [x] Verificação em 2026-11-25:
  - lint e typecheck: ok;
  - `npm test`: 26 arquivos, 258 testes (caracterização do YouTube passando, CA3);
  - `npm run build`: ok;
  - `npm run test:e2e`: 64 testes.
- [x] Depois do deploy (2026-11-25): o Preview novo buscou a Twitch às 20:30:40 UTC (100 itens); a produção, 24 s depois, não leu esse valor e fez a própria busca (`cached: false`), ficando com 98 lives da Twitch e 50 do YouTube. (CA4)
