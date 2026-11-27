# 045 — Plano

1. **`components/lives/live-explorer.tsx`:**
   - guardar o id da live aberta junto com o gatilho;
   - `closePlayer`: gatilho conectado → foco nele (D1); senão, link do card pelo `liveDomId` (D2); senão, `#lives-title` (D3).
   - `#lives-title` com `tabIndex={-1}` para aceitar foco programático.
2. **`e2e/player.spec.ts`:** `ended` e `unavailable`, no YouTube e na Twitch: `Esc` → foco no link "Abrir no YouTube"/"Abrir na Twitch" do card. O caso `live` já é coberto.

## Arquivos

- **Alterados:** `components/lives/live-explorer.tsx`, `e2e/player.spec.ts`

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`.
