# 051 — Plano

1. **`lib/lives/platforms.ts`:** Kick com `embed: true`, `embedSrc` (D1) e `consent` (D2); sem `loginNotice` nem `minPlayer` (D3).
2. **`components/lives/live-player-dialog.tsx`:** sem mudança esperada (o diálogo já é por plataforma; conferir textos e o artigo "a Política").
3. **`tests/player-state.test.ts`:** `embedSrc` da Kick (CA1); modo só-link continua coberto pelo teste de `resolvePlayerView`.
4. **`e2e/player.spec.ts`:** o teste "modo só-link" vira "Kick: consentimento e player oficial" (CA2, CA4) e um teste "Kick: live encerrada" (CA3), com `player.kick.com` respondido no teste (D5, D6).

## Arquivos

`lib/lives/platforms.ts`, `tests/player-state.test.ts`, `e2e/player.spec.ts`, `docs/specs/051-kick-player/*`

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`.
