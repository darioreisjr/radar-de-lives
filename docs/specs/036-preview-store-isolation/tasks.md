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
- [ ] Depois do deploy: abrir o Preview do PR e conferir a produção com até 100 lives da Twitch. (CA4)
