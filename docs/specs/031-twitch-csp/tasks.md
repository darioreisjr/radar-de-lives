# 031 — Tarefas

- [x] CSP: `img-src https://static-cdn.jtvnw.net` e `frame-src https://player.twitch.tv`, origens exatas. (D1)
- [x] `tests/security-headers.test.ts`: origens novas, YouTube igual, sem curinga, `connect-src 'self'`. (CA1, CA3, D2)
- [x] e2e: Twitch respondida localmente; miniatura da Twitch carrega sem violação de CSP. (CA2, D3)
- [x] Verificação em 2026-11-25:
  - lint e typecheck: ok;
  - `npm test`: 24 arquivos, 236 testes;
  - build e `npm run test:e2e`: 58 testes.
  - **Prova negativa:** com `https://static-cdn.jtvnw.net` retirado temporariamente da CSP, o teste da miniatura **falhou**, com a violação de `img-src` registrada pelo Chrome. Depois a configuração foi restaurada e a suíte inteira passou de novo.
- [ ] Teste do iframe da Twitch sem violação de CSP: fica para a #44, quando o player for ligado.
