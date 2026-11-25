# 032 — Plano

## Passos

1. **`lib/lives/platforms.ts`:**
   - `PLATFORMS.twitch` com `embed: true`, `embedSrc` (`channel`, `parent`, `autoplay=false`, `muted=true`), consentimento com o aviso de privacidade da Twitch e `minPlayer` 400×300;
   - `privacyArticle` no consentimento, para a concordância ("a Política", "o Aviso").
2. **`lib/lives/player-state.ts`:** `fitsPlayer` e estado `too_small`. Ele só substitui o consentimento e o player; os estados da live têm prioridade.
3. **`components/lives/live-player-dialog.tsx`:**
   - `useFitsWidth` (com `matchMedia` e `useSyncExternalStore`, reagindo a redimensionamento e rotação);
   - mensagem "Tela estreita para o player";
   - `min-height` da área do player conforme `minPlayer`;
   - artigo do consentimento vindo do mapa.
4. **Testes:**
   - `tests/player-state.test.ts`: URL da Twitch, `too_small` e prioridades;
   - `e2e/player.spec.ts`:
     - player da Twitch (desktop: consentimento, iframe com ≥ 400×300 e CSP; 375 px: tela estreita);
     - live encerrada;
     - frases do consentimento;
     - o modo só-link passa a usar a Kick.

## Arquivos

`lib/lives/platforms.ts`, `lib/lives/player-state.ts`, `components/lives/live-player-dialog.tsx`, `tests/player-state.test.ts`, `e2e/player.spec.ts`

## Verificação

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`.
- Capturas do diálogo (desktop e 375 px).
