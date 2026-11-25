# 026 — Tarefas

- [x] `lib/lives/sources.ts`: plataformas ativas, multiplataforma e resultado parcial. (D1, D2, CA4)
- [x] Filtro por plataforma em `applyLiveFilters`; contagem `platformBreakdown`. (CA3)
- [x] `Meta` com `sources` no estado do cliente.
- [x] Interface:
  - selo de plataforma e selo "Conteúdo adulto" no card (só texto, tons existentes);
  - select "Plataforma";
  - aviso parcial com `role="status"`;
  - "Por plataforma" no radar;
  - textos de dados antigos e de estado vazio adaptados quando há várias plataformas. (CA1, CA2, CA4, CA6)
- [x] Testes:
  - `tests/platform-ui.test.ts`: 7 testes;
  - `e2e/platforms.spec.ts`: 4 cenários × 2 perfis. (CA1 a CA6)
- [x] Verificação em 2026-11-25:
  - lint e typecheck: ok;
  - `npm test`: 20 arquivos, 187 testes; snapshot de caracterização inalterado; `contrast.test.ts` sem mudança (CA5);
  - build e `npm run test:e2e`: 56 testes; os 48 anteriores passam sem mudança;
  - **Capturas de tela** (desktop e 375 px), com YouTube e Twitch, uma live adulta e a Twitch falhando: selos, filtro, aviso parcial e "Por plataforma" conferidos visualmente.
- [ ] Pendente para a #46: textos que ainda citam só o YouTube (hero, nota de cobertura, rodapé).
