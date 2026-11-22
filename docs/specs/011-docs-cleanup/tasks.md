# 011 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente

- [x] T1 Fechados com evidência:
  - 001: chamada real, contraste, `next start` sem chave, cache compartilhado, domínio;
  - 002: política de privacidade, cache compartilhado;
  - 003: T8, T9;
  - 004: quota por atualização, pelos logs de produção;
  - 005: chave só em Production, restrição da chave (S-03);
  - 008 T8 (S-01);
  - 012 T6 (`curl` em produção).
- [x] T2 Apontados para tarefas do sprint:
  - reduced motion e estados vistos na UI → S-10;
  - testes de componente → S-09;
  - Search Console → S-07;
  - transferência internacional e legítimo interesse → S-01.
- [x] T3 002 "erros dentro do player" virou limitação aceita (D8), não pendência.
- [x] T4 Listas de pendências de lançamento da 003 e da 004 anotadas como resolvidas.
- [x] T5 Mantidos abertos com nota, sem evidência no repositório nem nos logs (decisão do usuário): 002 "live real", 004 "Assistir aqui" e 004 "Carregar mais".
- [x] T6 README:
  - Pendências → `sprint.md`;
  - link e regra das branches em Desenvolvimento;
  - linha do CI;
  - fatias 008, 009, 011, 012 e 016 na tabela;
  - aceite da política em Funcionalidades.
- [x] T7 CLAUDE.md: linha sobre o `sprint.md`.
- [x] T8 `grep -rnE "^\s*- \[ \]|^\s*- \[!\]" docs/specs` → 10 itens. 7 apontam para S-01, S-07, S-09 ou S-10; os 3 de T5 são a exceção registrada na spec. — CA1
- [x] T9 Sem código alterado. lint ok · typecheck ok · testes 117/117 (13 arquivos) · build ok (`/privacy` estática) — CA3
