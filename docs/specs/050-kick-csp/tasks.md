# 050 — Tarefas

- [x] `next.config.ts`: `img-src` + `https://images.kick.com https://web.kick.com`; `frame-src` + `https://player.kick.com`; comentário atualizado. (D1, D2)
- [x] `tests/security-headers.test.ts`: listas exatas atualizadas; teste novo da Kick: origens, `files.kick.com` fora, YouTube e Twitch iguais, nenhum curinga, `connect-src 'self'`. (CA1, CA3)
- [x] `e2e/platforms.spec.ts`: cards da Kick com miniatura em `images.kick.com` e `web.kick.com`, respondidas no próprio teste; carregam sem violação de CSP; o navegador só pede as duas miniaturas à Kick. (CA2, D4)
- [x] **Prova negativa:** sem as origens novas em `img-src`, o e2e falhou com "violates the following Content Security Policy directive" nas duas miniaturas; configuração restaurada e e2e verde de novo.
- [x] Verificação em 2026-11-27:
  - lint e typecheck: ok;
  - `npm test`: 31 arquivos, 320 testes;
  - `npm run test:e2e`: 74 testes (2 novos: Kick nos dois perfis);
  - bundle do cliente sem segredos.
- Fora do escopo: e2e do iframe da Kick (fica para a #53, quando o player for ligado; D5).
