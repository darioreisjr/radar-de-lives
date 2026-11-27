# 044 — Plano

1. **`lib/lives/platforms.ts`:** tipo `LoginNotice { beforeLoad; withPlayer }` e campo `loginNotice?` em `PlatformMeta`, preenchido só na Twitch. (D1)
2. **`components/lives/live-player-dialog.tsx`:**
   - no consentimento, parágrafo `beforeLoad` entre o texto de privacidade e o botão (D2);
   - no rodapé com player confirmado, `withPlayer` quando existir (D3).
3. **Testes:**
   - `tests/platform-ui.test.ts`: `loginNotice` só na Twitch, com "Abrir na Twitch";
   - `e2e/player.spec.ts`: Twitch mostra o aviso antes do botão e o rodapé com login depois de carregar; YouTube sem o aviso.

## Arquivos

- **Alterados:** `lib/lives/platforms.ts`, `components/lives/live-player-dialog.tsx`, `tests/platform-ui.test.ts`, `e2e/player.spec.ts`

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e` e conferência em produção depois do deploy.
