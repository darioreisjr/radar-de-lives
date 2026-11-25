# 031 — Plano

## Passos

1. **`next.config.ts`:**
   - `img-src` + `https://static-cdn.jtvnw.net`;
   - `frame-src` + `https://player.twitch.tv`;
   - comentário atualizado.
2. **`tests/security-headers.test.ts`:**
   - listas exatas atualizadas;
   - teste novo: origens da Twitch, YouTube sem mudança, nenhum curinga e `connect-src 'self'`.
3. **`e2e/support.ts`:** `static-cdn.jtvnw.net` e `player.twitch.tv` respondidos localmente.
4. **`e2e/platforms.spec.ts`:** card da Twitch com miniatura, que carrega sem violação de CSP.

## Arquivos

`next.config.ts`, `tests/security-headers.test.ts`, `e2e/support.ts`, `e2e/platforms.spec.ts`

## Verificação

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`.
- Prova negativa: sem a origem nova, o teste e2e da miniatura precisa falhar.
