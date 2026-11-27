# 051 — Tarefas

- [x] `lib/lives/platforms.ts`: Kick com `embed: true`, `embedSrc` = `https://player.kick.com/<slug>?autoplay=false&muted=true` (D1) e consentimento com a Política de Privacidade da Kick (`https://kick.com/privacy-policy`, 200 em 2026-11-27) (D2); sem `loginNotice` nem `minPlayer` (D3).
- [x] `components/lives/live-player-dialog.tsx`: sem mudança (textos e consentimento vêm do mapa; nada sobreposto ao iframe, D4).
- [x] `tests/player-state.test.ts`: `embedSrc` da Kick, igual em qualquer domínio e com slug codificado (CA1). O modo só-link segue coberto pelo teste de `resolvePlayerView` com `platformEmbed: false` (D6).
- [x] `e2e/player.spec.ts` (player da Kick respondido no próprio teste, D5):
  - "Kick: consentimento e player oficial": política da Kick antes do iframe, sem aviso de login, iframe com a URL oficial e título acessível, rodapé e link "Abrir na Kick", `Esc` e foco de volta ao card (CA1, CA2, CA4);
  - "Kick: live encerrada": sem iframe, "Esta live terminou", selo "Encerrada" e link (CA3);
  - o antigo "modo só-link" (que usava a Kick) foi substituído (D6).
- [x] Verificação em 2026-11-27:
  - lint e typecheck: ok;
  - `npm test`: 31 arquivos, 320 testes;
  - `npm run test:e2e`: 76 testes (desktop e 375 px), sem violação de CSP.
- [ ] Na #55: testar o player num Preview da Vercel com a Kick ativa.
