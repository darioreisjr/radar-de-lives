# 035 — Tarefas

- [x] `TWITCH_DEFAULT_MAX_PAGES = 1` em `lib/twitch/search.ts`. (D3)
- [x] `TWITCH_MAX_PAGES` em `getServerEnv` (padrão 1, faixa 1–3). (D1, D2)
- [x] `server.ts` passa `maxPages` e inclui o valor na assinatura do runtime. (D4)
- [x] `.env.example` documentado.
- [x] Testes: 1 página por padrão (CA1), 3 páginas com `maxPages: 3` (CA2), leitura da variável (CA3).
- [x] Verificação em 2026-11-25:
  - lint e typecheck: ok;
  - `npm test`: 26 arquivos, 255 testes (caracterização do YouTube passando, CA4);
  - `npm run build`: ok;
  - `npm run test:e2e`: 64 testes.
- [ ] Depois do deploy: `/api/lives` com no máximo 100 lives da Twitch, intercaladas. (CA5)
