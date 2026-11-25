# 033 — Tarefas

- [x] `/privacy`: API, miniaturas, player, cache, fornecedor, transferência, retenção, controles e menores de 13 anos, com a Twitch. (CA1)
- [x] `/terms`: serviço, terceiros, marcas sem afiliação, conteúdo com link à origem, uso permitido, "Idade e conteúdo", cache e limites. (CA2)
- [x] `siteConfig.disclaimer` com a Twitch; `updatedAt` = `2026-11-25`. (CA4)
- [x] Links oficiais da Twitch conferidos (200, sem redirecionamento). (D1)
- [x] Testes:
  - `tests/legal-twitch.test.ts`: 5 testes;
  - e2e: nada para a Twitch antes do aceite, nos 2 perfis. (CA3, CA4)
- [x] Verificação em 2026-11-25:
  - lint e typecheck: ok;
  - `npm test`: 25 arquivos, 245 testes;
  - build e `npm run test:e2e`: 64 testes.
- [ ] **Responsável:** revisar os textos de `/privacy` e `/terms` (Preview do PR).
- [ ] **Responsável:** atualizar o registro de transferência internacional com o adendo da spec, fora do repositório.
- [ ] Mesclar no dia da ativação da Twitch (#47), ajustando `updatedAt` se a data mudar.
