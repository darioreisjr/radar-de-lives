# 045 — Tarefas

- [x] `closePlayer`: gatilho conectado → foco nele; senão, link da plataforma no card; senão, `#lives-title`. (D1 a D3)
- [x] `#lives-title` com `tabIndex={-1}`. (D3)
- [x] e2e: `ended` e `unavailable`, YouTube e Twitch, nos dois perfis (8 testes novos). (CA1, CA3)
- [x] Teste negativo: sem a correção, os 4 testes novos do perfil desktop falham (`toBeFocused`); com ela, passam.
- [x] Verificação em 2026-11-27:
  - lint e typecheck: ok;
  - `npm test`: 26 arquivos, 259 testes;
  - `npm run build`: ok (dentro do e2e);
  - `npm run test:e2e`: 72 testes (o caso `live` segue com o foco no "Assistir aqui", CA2).
