# 049 — Tarefas

- [x] Conferir na especificação OpenAPI oficial um endpoint por slug: `GET /public/v1/channels?slug=` (até 50 slugs de até 25 caracteres; aceita token de app). Lido em 2026-11-27.
- [x] `lib/kick/status.ts`: `KICK_SLUG` (D4); schema que lê só `slug`, `stream.is_live` e `stream.viewer_count` (D2); `createKickStatusService` com cache de 60 s, single-flight e store fora → fecha (D5); mapeamento live/ended/unavailable (D3).
- [x] `lib/lives/providers/kick.ts`: `status` com `isValidId` = `KICK_SLUG`.
- [x] **Ampliação** `lib/lives/server.ts`: serviço de status com `status:kick` (500 entradas, 60 s). (D7)
- [x] `tests/kick-status.test.ts` (11 testes): CA1 ao vivo com espectadores; CA2 offline (`is_live` falso, sem `stream` ou `stream` vazio); slug inexistente → `unavailable`; viewers ausentes → `null`; CA3 formato do slug; CA4 cache de 60 s e single-flight; **CA5 resposta e cache sem `key`/`url` do stream**; erro do cliente; store fora; rota pelo handler (ativa, slug inválido → 400 sem chamar a Kick, sem revalidação, inativa).
- [x] `tests/kick-service.test.ts`: o teste de timeout passa a dizer que a revalidação existe com o serviço de status.
- [x] Verificação em 2026-11-27:
  - lint e typecheck: ok;
  - `npm test`: 31 arquivos, 319 testes;
  - `npm run test:e2e`: na 1ª rodada, 71 de 72, com uma falha **intermitente** de foco (`toBeFocused`) num teste que não identifiquei; na 2ª rodada, 72 de 72. Os testes de foco e teclado repetidos 5 vezes nos dois perfis: 60 de 60. Esta issue não mexe em interface; a instabilidade fica registrada para acompanhar no CI;
  - bundle do cliente sem segredos.
- [ ] Na #55 (Preview com credenciais): confirmar a resposta real para canal offline e slug inexistente.
- Observação: a busca (spec 047) aceita slugs de até 64 caracteres; a API de canais, até 25. Um slug maior (não visto no spike) teria a revalidação recusada com `400`, e o player abriria com o aviso "não conseguimos confirmar".
