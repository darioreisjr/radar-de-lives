# 028 — Tarefas

- [x] Confirmar na documentação oficial o campo de classificação: `content_classification_labels: string[]` em `GET /helix/channels` (token de app, até 100 ids), com 7 rótulos possíveis; `MatureGame` é automático.
- [x] Schemas Zod com validação item a item. (D6)
- [x] `normalizeStream` e helpers. (CA1, CA2, CA3, CA5, D7)
- [x] `searchTwitchLives`: páginas, dedupe, inválidos, selo adulto e tolerância a falhas. (CA4, CA6, CA7, D2 a D5)
- [x] `tests/twitch-normalize.test.ts`: 14 testes, incluindo o contrato com a fixture real.
- [x] Verificação em 2026-11-25:
  - lint e typecheck: ok;
  - `npm test`: 22 arquivos, 215 testes;
  - build e `npm run test:e2e`: 56 testes;
  - bundle do cliente limpo.
- [x] Regra D1 aprovada pelo responsável em 2026-11-25: contam `SexualThemes`, `DrugsIntoxication`, `ViolentGraphic`, `ProfanityVulgarity` e `Gambling`; não contam `MatureGame` e `DebatedSocialIssuesAndPolitics`.
