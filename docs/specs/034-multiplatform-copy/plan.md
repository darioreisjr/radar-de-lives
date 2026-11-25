# 034 — Plano

## Passos

1. **`lib/lives/platforms.ts`:** `apiLabel` ("da YouTube Data API", "da API da Twitch", "da API da Kick").
2. **`lib/lives/copy.ts`:** `formatPlatformList`, `siteDescription`, `coverageNote`, `heroLead`, `watchElsewhere`, `thumbnailsSource` e `searchSubject`.
3. **`lib/lives/active-platforms.ts`:** `getActivePlatforms()` (D1).
4. **Componentes do servidor:**
   - `app/layout.tsx` (metadata);
   - `app/opengraph-image.tsx` (texto alternativo e frase);
   - `components/hero/hero-section.tsx`;
   - `components/layout/site-footer.tsx` (cobertura, "assistidos" e frase da Twitch).
5. **Página e cliente:**
   - `app/page.tsx` calcula a lista e passa para `PolicyGate` e `LivesProvider`;
   - o contexto ganha `platforms`;
   - `radar-panel.tsx` e `live-explorer.tsx` usam a lista;
   - `policy-gate.tsx` ganha a frase da Twitch e a origem das miniaturas.
6. **Testes:** `tests/copy.test.ts`, com frases exatas para uma e duas plataformas, a regra das plataformas ativas e "nunca todas".

## Arquivos

- **Novos:** `lib/lives/copy.ts`, `lib/lives/active-platforms.ts`, `tests/copy.test.ts`
- **Alterados:** `lib/lives/platforms.ts`, `app/layout.tsx`, `app/opengraph-image.tsx`, `app/page.tsx`, `components/hero/hero-section.tsx`, `components/hero/radar-panel.tsx`, `components/layout/site-footer.tsx`, `components/consent/policy-gate.tsx`, `components/lives/lives-provider.tsx`, `components/lives/live-explorer.tsx`

`lib/config/site.ts` não mudou: `description` e `coverageNote` ficam como valores do YouTube; o `disclaimer` é da spec 033.

## Verificação

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`.
- Build real com e sem a Twitch, conferindo o HTML.
