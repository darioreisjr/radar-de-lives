# 018 — Plano

- Função pura `playerBadge({ demo, listIsLive, check })` ao lado de `resolvePlayerView`, testada no Vitest.
- O diálogo troca a expressão do selo por `BADGE_LABEL[badge]`, mantendo o `LiveBadge` para "live" e o tom `demo` para itens simulados.
- e2e (`e2e/player.spec.ts`): cada caso de revalidação confere o texto do selo.
- Risco baixo: só texto do selo no diálogo. Rollback: reverter o PR.
