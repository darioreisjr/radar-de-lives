# 053 — Plano

1. **Tipos (`lib/lives/types.ts`):** sem `videoId`; `LivesPayload.source` → `demo?: true`. (D1, D4)
2. **Identidade (`lib/lives/identity.ts`):** `withIdentity(CachedLiveItem)` → `LiveItem` sem `videoId`. (D2)
3. **Normalização:** `lib/youtube/normalize.ts` e `lib/twitch/normalize.ts` sem `videoId`; `dedupeByVideoId` removido. (D1, D7)
4. **Provedores:** YouTube monta o status sem `videoId`; Twitch passa os itens por `withIdentity`. **Status da Twitch:** sem `videoId` ao gravar e ao ler. (D2, D3)
5. **Rotas:** apagar `app/api/lives/[videoId]`; `app/api/lives/route.ts` sem `source`; `status-handler` sem `idLabel`. (D5)
6. **Cliente:** `lives-provider.tsx` (`demo: true`) e `explorer-state.ts` (`Meta` com `demo`). Fixtures sem `videoId`. (D4)
7. **Testes:** unitários e e2e sem `videoId`/`source`; caracterização com `videoId` lido de `sourceId` (D6); novos: cache antigo e atual saem sem `videoId` (CA2), payload de `/api/lives` sem os campos (CA1), demo marcado (CA3); build real: `/api/lives/x` → 404 (CA4).
8. **Docs:** README (API) e CLAUDE.md (rotas, identidade).

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`; depois do deploy, conferir em produção `/api/lives` sem `videoId`/`source` e `/api/lives/<id>` → 404.
