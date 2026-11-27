# 055 — Tarefas

- [x] Reprodução confiável da sequência do QA (live → ended → unavailable, 9 lives, 1280 px): **8 de 16** casos encerrados/indisponíveis com o foco lido no diálogo fechado.
- [x] Instrumentação (focusin, `cancel`, `close`, remoção do diálogo): o foco chega ao card só com o evento `close`, ~30 a 140 ms depois do `Esc`. Causa registrada na spec.
- [x] Teste novo em `e2e/player.spec.ts` (3 casos × 2 perfis): `Esc` e leitura do foco na mesma tarefa. **Falhou antes da correção** ("foco não pode ficar no diálogo fechado"). (CA1)
- [x] `components/lives/live-player-dialog.tsx`: `requestClose`, `onCancel` com `preventDefault`, botão de fechar e `onClose` com `closedRef`. (D1 a D3)
- [x] Depois da correção:
  - sequência do QA: **30 de 30** corretas;
  - testes de foco (3 novos + 4 da spec 045) com `--repeat-each 9` nos dois perfis: **126 de 126** (CA2, CA3).
- [x] Verificação em 2026-11-27:
  - lint e typecheck: ok;
  - `npm test`: 32 arquivos, 327 testes;
  - `npm run test:e2e`: 84 testes.
