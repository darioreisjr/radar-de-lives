# 026 — Plano

## Passos

1. **`lib/lives/sources.ts`** (novo): `activePlatforms`, `isMultiPlatform` e `hasPartialFailure` (D1, D2).
2. **`lib/lives/filter.ts`:** `platform?: Platform | "all"` em `LiveFilters`.
3. **`lib/lives/radar-stats.ts`:** `platformBreakdown(items, platforms)`.
4. **`lib/lives/explorer-state.ts`:** `Meta` passa a guardar `sources`.
5. **Componentes:**
   - `live-filters.tsx`: select "Plataforma" só com 2 ou mais plataformas ativas;
   - `live-card.tsx`: selo de plataforma (`showPlatform`) e selo "Conteúdo adulto" (`isMature`), com o `Badge` existente (D3);
   - `live-explorer.tsx`:
     - plataformas ativas a partir de `meta.sources`;
     - filtro ignorado com uma plataforma (D4);
     - aviso parcial;
     - aviso de dados antigos com texto genérico quando há várias plataformas;
   - `states.tsx`: estado vazio cita a plataforma quando o filtro está visível;
   - `radar-panel.tsx`: bloco "Por plataforma".
6. **Testes:**
   - `tests/platform-ui.test.ts` (novo);
   - `e2e/platforms.spec.ts` (novo): uma plataforma, várias plataformas, resultado parcial e selo adulto.

## Arquivos

- **Novos:** `lib/lives/sources.ts`, `tests/platform-ui.test.ts`, `e2e/platforms.spec.ts`
- **Alterados:** `lib/lives/filter.ts`, `lib/lives/radar-stats.ts`, `lib/lives/explorer-state.ts`, `components/lives/live-filters.tsx`, `components/lives/live-card.tsx`, `components/lives/live-explorer.tsx`, `components/lives/states.tsx`, `components/hero/radar-panel.tsx`

Diferenças em relação à lista da issue:
- **Não alterados:** `design-tokens.ts`, `globals.css`, `contrast.test.ts` e `lib/fixtures/lives.ts` (D3, D5).
- **Novo:** `lib/lives/sources.ts`, com os helpers puros.

## Verificação

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`.
- Capturas de tela do cenário com várias plataformas (desktop e 375 px), para revisão visual.
