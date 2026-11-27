# 047 — Tarefas

- [x] `lib/kick/types.ts`: schema do item (`LivestreamV2`, campos usados) e da página (`data` sem validar, `next_cursor`). (D3)
- [x] `lib/kick/normalize.ts`: miniatura só em `images.kick.com`/`web.kick.com` com HTTPS (D7); idioma pelo prefixo (D4); viewers `null` quando ausentes (CA2); `normalizeLivestream` com `isMature: false` (D6), `channelId` = id numérico do usuário (D8), `watchUrl`/`embedUrl` (D9).
- [x] `lib/kick/search.ts` (`server-only`): `v2/livestreams` com `category_id` e `limit=1000`, cursor até 5 páginas (D1), falha parcial (D2), validação item a item com contagem (D3), sem duplicatas por slug, só pt/en/es, ordem por espectadores e corte nas 100 maiores (D4, D5).
- [x] `tests/kick-normalize.test.ts` (14 testes, com a fixture real anonimizada do spike e cliente falso): CA1 a CA6, incluindo `en-IN` → `en`, miniatura em domínio estranho → `null`, teto de páginas e itens sem número no fim.
- [x] Verificação em 2026-11-27:
  - lint e typecheck: ok;
  - `npm test`: 29 arquivos, 293 testes;
  - `npm run build`: ok; bundle do cliente sem `id.kick.com/oauth` nem `KICK_CLIENT_SECRET`.
- Fora do escopo: cache e registro no agregador (#50); status (#51); player (#53). A fixture do spike foi usada como está (`tests/fixtures/kick/livestreams-v2.json`).
