# 021 — Tarefas

- [x] Teste de caracterização e snapshot gravados antes da mudança (10 cenários). (RNF1)
- [x] `lib/lives/types.ts` criado; `lib/youtube/types.ts` reexporta os tipos neutros e mantém `Yt*` e `VideoStatusPayload`. (RF1)
- [x] `lib/lives/identity.ts` com `liveId`, `dedupeById` e `liveDomId`; testes em `tests/identity.test.ts`. (CA3, CA5)
- [x] `normalizeLives` e `getDemoLives` preenchem `id`, `platform`, `sourceId` e `isMature`. (CA1)
- [x] Estado e componentes usam `id`:
  - `explorer-state` usa `dedupeById`, e `item-status` casa por plataforma e `sourceId`;
  - `live-explorer` usa `id` como chave e seleção;
  - `live-card` usa `liveDomId`;
  - o player usa `sourceId`.
  - `grep videoId components/` não encontra nada. (CA2)
- [x] Fábricas de teste (`tests/explorer-state.test.ts`, `tests/radar-stats.test.ts`) e do e2e (`e2e/support.ts`) atualizadas, sem mudar asserções. (CA4)
- [x] Verificação em 2026-11-25. (CA4)
  - `npm run lint`: ok.
  - `npm run typecheck`: ok.
  - `npm test`: 16 arquivos e 145 testes passando; **snapshot de caracterização inalterado**.
  - `npm run build`: ok.
  - `npm run test:e2e`: 46 passando (desktop e mobile-375).
