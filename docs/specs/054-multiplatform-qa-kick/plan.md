# 054 — Plano

1. Build local (porta 3100), como no e2e.
2. Script Playwright temporário (`e2e/qa-054*.spec.ts`, apagado no fim), reaproveitando `e2e/support.ts` e respondendo `images.kick.com`, `web.kick.com` e `player.kick.com` no próprio script:
   - estados com três `sources` e combinações de falha;
   - filtros com a Kick;
   - player da Kick (`live`, `ended`, `unavailable`) em 360, 768 e 1280 px; foco ao fechar;
   - teclado, foco visível, `aria-live`, movimento reduzido;
   - capturas inspecionadas.
3. Smoke em produção, só leitura: lista, filtro "Kick", player real, CSP, textos.
4. Registrar em `tasks.md`; falhas → issues ligadas ao #28.

## Arquivos

`docs/specs/054-multiplatform-qa-kick/*`
