# 050 — Plano

1. **`next.config.ts`:** `img-src` + `https://images.kick.com https://web.kick.com`; `frame-src` + `https://player.kick.com`; comentário atualizado. (D1, D2)
2. **`tests/security-headers.test.ts`:** listas exatas atualizadas; teste novo da Kick (origens, YouTube e Twitch iguais, sem curinga, `connect-src 'self'`). (CA1, CA3)
3. **`e2e/platforms.spec.ts`:** cards da Kick com miniatura em `images.kick.com` e `web.kick.com`, respondidas localmente no teste; carregam sem violação de CSP e sem requisição a outro host da Kick. (CA2, D4)
4. **Prova negativa:** sem as origens novas, o e2e da miniatura precisa falhar.

## Arquivos

`next.config.ts`, `tests/security-headers.test.ts`, `e2e/platforms.spec.ts`, `docs/specs/050-kick-csp/*`

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`.
