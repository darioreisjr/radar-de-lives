# 032 — Tarefas

- [x] Player oficial da Twitch no mapa: `parent` = hostname, `autoplay=false`, `muted=true`, aviso de privacidade da Twitch, mínimo de 400×300. (D1, D2, D4; CA1)
- [x] Estado `too_small` abaixo de 432 px de largura; área do player com `min-height` de 300 px. (D3, CA4)
- [x] Link "Abrir na Twitch" sempre fora da área do player. (D5)
- [x] Testes:
  - unitários: URL da Twitch, `too_small` e prioridades;
  - e2e:
    - desktop: consentimento, iframe com ≥ 400×300 e sem violação de CSP;
    - 375 px: tela estreita;
    - live encerrada;
    - `Esc` e volta do foco;
    - só-link com a Kick. (CA1 a CA5)
- [x] **Corrigido pelas capturas:** "conforme a Aviso…" virou "conforme o Aviso…" (`privacyArticle` no mapa). O e2e agora confere a frase da Twitch e a do YouTube.
- [x] Verificação em 2026-11-25:
  - lint e typecheck: ok;
  - `npm test`: 24 arquivos, 240 testes;
  - build e `npm run test:e2e`: 62 testes;
  - capturas do diálogo revisadas (desktop: consentimento; 375 px: tela estreita).
- [ ] No Preview (#47): confirmar que o player carrega com o `parent` do domínio do Preview.
