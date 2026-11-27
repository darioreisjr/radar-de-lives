# 044 — Tarefas

- [x] `LoginNotice` e `loginNotice` no mapa de plataformas, só na Twitch. (D1)
- [x] Aviso no consentimento, entre o texto de privacidade e "Carregar player". (D2, CA1, CA3)
- [x] Rodapé com o player da Twitch carregado cita o login. (D3, CA4)
- [x] Testes:
  - `tests/platform-ui.test.ts`: aviso só na Twitch, apontando para "Abrir na Twitch";
  - `e2e/player.spec.ts`: na Twitch, o aviso aparece acima do botão e o rodapé cita o login; no YouTube, sem aviso e com o rodapé de antes. (CA2, CA5)
- [x] Verificação em 2026-11-27:
  - lint e typecheck: ok;
  - `npm test`: 26 arquivos, 259 testes;
  - `npm run build`: ok (dentro do e2e);
  - `npm run test:e2e`: 64 testes;
  - captura do diálogo em 1280 px: aviso em destaque acima de "Carregar player"; rodapé "Se a Twitch pedir login ou o player não carregar, abra na Twitch." com o player carregado.
- [x] Depois do deploy (2026-11-27): em produção, numa live real da Twitch, o aviso aparece antes de "Carregar player" e o rodapé cita o login com o player aberto; o YouTube segue sem aviso. Registrado na [#86](https://github.com/darioreisjr/radar-de-lives/issues/86#issuecomment-7212188271).
