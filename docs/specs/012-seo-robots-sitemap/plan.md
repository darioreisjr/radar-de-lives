# 012 — Plano

1. `app/sitemap.ts`: `siteOrigin()` (R3) + 3 entradas (R2, D2, D3).
2. `app/robots.ts`: regra única e `sitemap` (R1), usando `siteOrigin()` (D4).
3. `tests/seo.test.ts`: base pela variável, alternativa sem variável e com valor inválido, frequências e ausência de `/api`.
4. Verificar: lint, typecheck, testes, build com `NEXT_PUBLIC_SITE_URL=https://radardelives.darioreis.dev`, `next start` + `curl` nos dois arquivos.

Rollback: apagar os dois arquivos; não há dados nem variáveis novas.
