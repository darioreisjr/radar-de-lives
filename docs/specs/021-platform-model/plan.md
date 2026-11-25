# 021 — Plano

## Sequência

1. **Caracterização (primeiro commit):** criar `tests/characterization.test.ts` e o snapshot, só com os campos da v1.0.
2. **Tipos:** criar `lib/lives/types.ts` e mover para lá `LiveLanguage`, `LangFilter`, `SortOption`, `LiveItem`, `LivesPayload`, `LivesErrorCode` e `LivesErrorPayload`. `lib/youtube/types.ts` os reexporta, para que os arquivos fora do escopo continuem compilando sem mudança.
3. **Identidade:** criar `lib/lives/identity.ts` com:
   - `liveId(platform, sourceId)`;
   - `dedupeById(items)`;
   - `liveDomId(item)`, que no YouTube devolve `live-<videoId>` e nas outras plataformas `live-<platform>-<sourceId sanitizado>`.
4. **Normalizador do YouTube:** `normalizeLives` passa a preencher `id`, `platform`, `sourceId` e `isMature`.
5. **Demonstração:** `getDemoLives` faz o mesmo.
6. **Estado do cliente:**
   - `explorer-state.ts` usa `dedupeById`;
   - `item-status` casa pelo `sourceId` de itens do YouTube.
7. **Componentes:**
   - `live-explorer.tsx` usa `item.id` como chave e na seleção;
   - `live-card.tsx` usa `liveDomId`;
   - `live-player-dialog.tsx` continua chamando a rota e o `embedSrc` com `sourceId` (equivalente ao `videoId`) até a #37.
8. **Testes:** atualizar as fábricas `LiveItem` de `tests/*.test.ts` e `e2e/support.ts`, e criar `tests/identity.test.ts`.
9. **Verificação:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`.

## Arquivos

- **Novos:** `lib/lives/types.ts`, `lib/lives/identity.ts`, `tests/identity.test.ts`, `tests/characterization.test.ts`, `tests/__snapshots__/characterization.test.ts.snap`
- **Alterados:** `lib/youtube/types.ts`, `lib/youtube/normalize.ts`, `lib/fixtures/lives.ts`, `lib/lives/explorer-state.ts`, `lib/lives/filter.ts`, `lib/lives/radar-stats.ts`, `components/lives/live-card.tsx`, `components/lives/live-explorer.tsx`, `components/lives/live-player-dialog.tsx`, `tests/explorer-state.test.ts`, `tests/radar-stats.test.ts`, `tests/normalize.test.ts`, `e2e/support.ts`

`e2e/support.ts` entrou por causa do ajuste da seção 3 do plano multiplataforma. A lista da issue incluía também `lib/lives/player-state.ts`, `lives-provider.tsx` e `tests/player-state.test.ts`; eles só serão alterados se o typecheck exigir.

## Variáveis de ambiente

Nenhuma.

## Rollback

Reverter o PR.
