# 042 — Plano

1. `npm run build` e `next start` na porta 3100 com `LIVES_PROVIDERS=youtube,twitch`, `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET` falsos e `YOUTUBE_API_KEY` vazia. (D1)
2. Script Playwright temporário (`e2e/qa-042.spec.ts`, apagado no fim, não commitado) reaproveitando `e2e/support.ts`:
   - estados com `sources` de cada combinação;
   - filtros combinados;
   - player da Twitch com a revalidação simulada (`live`, `ended`, `unavailable`) e em 360 px;
   - teclado, foco visível, regiões `aria-live` e `role="status"`;
   - movimento reduzido;
   - capturas em 360, 768 e 1280 px e checagem de rolagem horizontal.
3. Inspecionar as capturas.
4. Smoke em produção (`https://radardelives.darioreis.dev`), sem simulação: lista, filtro "Twitch", selo adulto, player real da Twitch e CSP. (D5)
5. Registrar a tabela em `tasks.md`. Falhas → issues ligadas ao #28.

## Arquivos

- **Novos:** `docs/specs/042-multiplatform-qa/spec.md`, `plan.md`, `tasks.md`

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e` (sem mudança de código, para confirmar a base).
