# 052 — Tarefas

- [x] `app/privacy/page.tsx`: resumo com a Kick; seção "Uso da API da Kick" (metadados públicos, credenciais do site, sem dados de quem visita; termos e política da Kick); cache (3 + 10 min); registros técnicos; miniaturas (`images.kick.com` e `web.kick.com`), player e link da Kick; fornecedor Kick; transferência internacional; retenção; controles; **16 anos**. (CA1, D1, D2, D3)
- [x] `app/terms/page.tsx`: serviço; "YouTube, Twitch, Kick e serviços de terceiros" (termos e política da Kick); marcas e ausência de afiliação; conteúdo; uso permitido com a proibição de redistribuir dados (D5); **16 anos** e o selo adulto que não aparece na Kick (D4); cache e limites das três APIs. (CA2)
- [x] `lib/config/site.ts`: `disclaimer` com a Kick (D6) e `legal.updatedAt` = `2026-11-27` (D7). (CA4)
- [x] `components/consent/policy-gate.tsx`: sem mudança (D8); provado pelo e2e.
- [x] Testes:
  - `tests/legal-kick.test.ts` (novo, 7 testes): links da Kick nas duas páginas e no aviso do player, servidor sem dados de visitantes, marca, 16 anos, selo adulto e re-distribuição, tempos de cache iguais aos padrões, data;
  - `tests/legal-twitch.test.ts`: 13 → 16 anos, aviso de marca e frases de cache com a Kick, data;
  - `e2e/platforms.spec.ts`: sem aceite, nenhuma requisição a domínios da Kick nem à API; depois do aceite, só a miniatura. (CA3)
- [x] Verificação em 2026-11-27:
  - lint e typecheck: ok;
  - `npm test`: 32 arquivos, 327 testes;
  - `npm run test:e2e`: 78 testes;
  - build: `/privacy` e `/terms` com "menores de 16 anos", link da política da Kick e data "27 de novembro de 2026"; rodapé com "YouTube, Twitch ou Kick".
- [ ] Mesclar **junto com a ativação da Kick (#55)**; se o dia mudar, atualizar `updatedAt` e os dois testes. (D7)
- [ ] Responsável: atualizar o registro de transferência internacional com o adendo da spec.
