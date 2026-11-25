# 022 — Tarefas

- [x] `SourceStatus` e `sources?` em `lib/lives/types.ts`. (D6, D9)
- [x] Contrato `LivesProvider` (`lib/lives/providers/types.ts`) e adaptador do YouTube (`providers/youtube.ts`) com `withIdentity`. (D8, CA7)
- [x] Agregador (`lib/lives/aggregator.ts`): `allSettled`, timeout opcional por provedor, `pageToken` só no YouTube, erro total e parcial, intercalação, dedupe por `id` e metadados agregados. (CA2, CA3, CA4, CA8)
- [x] Servidor (`getLivesAggregator`) e rota `/api/lives` usando o agregador e enviando `sources`. O cache do YouTube mantém o namespace e as chaves (D1). (CA1, CA3)
- [x] Telemetria `provider_failed` (warn), só com `platform` e `code`. (CA6)
- [x] `tests/aggregator.test.ts`: 11 testes, incluindo cache vazio, cache válido (CA5) e cache com itens anteriores à 021 (CA7). (CA1 a CA8)
- [x] Verificação em 2026-11-25:
  - lint e typecheck: ok;
  - `npm test`: 17 arquivos, 158 testes, **snapshot de caracterização inalterado**;
  - build: ok (dentro do e2e);
  - `npm run test:e2e`: 46 testes (desktop e mobile-375).
