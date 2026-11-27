# 055 — Plano

1. Reproduzir a sequência do QA e instrumentar foco, `cancel`, `close` e remoção do diálogo (script temporário).
2. **`e2e/player.spec.ts`:** teste que dispara o `Esc` e lê o foco **na mesma tarefa**, para `live`, `ended` e `unavailable`, com 9 lives e três plataformas. Precisa falhar antes da correção.
3. **`components/lives/live-player-dialog.tsx`:** `requestClose` (fecha e avisa o pai na hora), `onCancel` com `preventDefault`, botão de fechar com `requestClose`, `onClose` com `closedRef`. (D1 a D3)
4. Repetir os testes de foco ≥ 50 vezes; suítes completas.

## Arquivos

`components/lives/live-player-dialog.tsx`, `e2e/player.spec.ts`, `docs/specs/055-player-focus-race/*`
