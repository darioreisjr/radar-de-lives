# 047 — Plano

1. **`lib/kick/types.ts`:** `KickLivestreamSchema` (item) e `KickLivestreamsPageSchema` (`data: unknown[]`, `pagination.next_cursor` opcional).
2. **`lib/kick/normalize.ts`:** `kickThumbnail` (D7), `kickLanguage` (D4), `kickViewers` (CA2) e `normalizeLivestream(item, rank)` (D6, D8, D9).
3. **`lib/kick/search.ts`:** `searchKickLives(client, { categoryId, maxPages = 5, maxItems = 100, log })`: paginação com cursor (D1, D2), validação item a item (D3), dedupe por `slug`, filtro de idioma, ordenação e corte (D4, D5).
4. **`tests/kick-normalize.test.ts`:** fixture do spike (`tests/fixtures/kick/livestreams-v2.json`) e cliente falso, cobrindo CA1 a CA6.

## Arquivos

- **Novos:** `lib/kick/types.ts`, `lib/kick/normalize.ts`, `lib/kick/search.ts`, `tests/kick-normalize.test.ts`, `docs/specs/047-kick-search/*`

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
