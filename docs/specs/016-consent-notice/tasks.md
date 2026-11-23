# 016 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente

- [x] T1 Lógica do aceite em `lib/consent/policy-acceptance.ts` + 7 testes (`tests/policy-acceptance.test.ts`) — CA1, CA3
- [x] T2 `PolicyGate` envolvendo a home — CA1, CA2
- [x] T3 `/privacy` e `/terms` com os textos das minutas, ajustados ao código; controlador "Dario Reis" — CA3, CA4
- [x] T4 lint ok · typecheck ok · testes 113/113 (12 arquivos) · build ok com `/`, `/privacy` e `/terms` estáticas (○) — CA5
- [x] T5 Chrome, `next dev` sem chave (fixtures, sem quota):
  - primeira visita: aviso "Antes de ver as lives"; 0 requisições a `/api/lives` ou `ytimg` — CA1, CA2
  - "Não concordo": mensagem em `role=status`; nada gravado; 0 requisições — CA2
  - "Li e concordo. Continuar": grava `{"version":"2026-11-22","acceptedAt":"…"}`; lista carregada (16 cards); foco no conteúdo — CA1, CA3
  - recarga: aviso não reaparece; com versão `2026-11-21` guardada, reaparece — CA1
  - 375 px (iframe): sem rolagem horizontal em `/`, `/privacy` e `/terms` — CA6
- [x] T6 Links externos novos respondem 200 (Upstash, Vercel, ANPD, doc do Analytics)
- [x] Mecanismo de transferência internacional verificado em 23/11/2026, com os textos integrais dos DPAs:
  - Vercel (vigente desde 31/03/2026): cláusulas-padrão da Comissão Europeia e UK IDTA;
  - Upstash (abr/2025): Data Privacy Framework e cláusulas-padrão da Comissão Europeia;
  - nenhum dos dois cita Brasil, LGPD ou ANPD.

  Decisão registrada pelo controlador (documento fora do repositório): manter a política sem afirmar conformidade com o art. 33. Pedido das cláusulas da ANPD preparado para os dois fornecedores (rascunhos de e-mail).
- [x] Registro de legítimo interesse do limite de requisições preenchido e guardado pelo controlador em 23/11/2026 (documento fora do repositório; revisão anual)
