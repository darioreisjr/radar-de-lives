# 002 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente · [!] bloqueado
Última atualização: 2026-11-22

- [x] T1 `daily-budget.ts` extraído e usado por `service.ts` e `video-status.ts` (testes da 001 seguem verdes)
- [x] T2 `video-status.ts` + testes: live/encerrada/agendada/indisponível, cache 60 s, orçamento, quota, sem chave — CA4, CA5
- [x] T3 Rota `GET /api/lives/[videoId]`; curl: `abc` → 400, id inválido → 400, sem chave → 503 — CA3
- [x] T4 `player-state.ts` + testes: consentimento antes do iframe, falha não bloqueia, embed desativado, URL sem autoplay — CA1, CA2, CA6, CA7
- [x] T5 `explorer-state.ts` extraído + `item-status` + testes (encerrada, audiência não vira zero) — CA9
- [x] T6 `LivePlayerDialog`: `<dialog>` modal, consentimento, iframe com `referrerPolicy`, estados, scroll travado — CA1, CA2, CA8, CA10
- [x] T7 Card: "Assistir aqui", "Encerrada", "Incorporação desativada pelo canal", placeholder "Sem miniatura" — CA7, CA9
- [x] T8 Rodapé com Termos do YouTube e Política de Privacidade do Google — RF9
- [x] T9 lint ok · typecheck ok · testes 52/52 · build ok · chave fictícia 0× em `.next` — CA11
- [x] T10 Chrome (respostas da API simuladas só na aba de teste):
  - diálogo simulado abre como modal, foco no "Fechar", Esc fecha, foco volta ao botão do card — CA8
  - 375 px: player 337×200 px, nada sobreposto, sem `autoplay`, `strict-origin-when-cross-origin` — CA10
  - revalidação "encerrada": sem iframe e card vira "Encerrada"; embed desativado: card sem "Assistir aqui"
  - iframe oficial carregou; com ID fictício o YouTube mostra "vídeo não disponível" e o link de fallback fica visível

## Não verificado / limitações
- [ ] Fluxo com chave real e live real. Segundo o `sprint.md`, foi feito em produção (`videos.list` de 1 ID após "Assistir aqui"), mas a evidência ficou só na conversa de deploy. Os logs da Vercel consultados em 2026-11-22 começam às 10:04 UTC e não têm essa chamada. Fica aberto até haver registro (spec 011).
- Limitação aceita, não é pendência: erros dentro do player (Content ID, região) não são detectados pelo app (D8); só o link de fallback.
- [ ] Testes de componente automatizados (RTL/Playwright) — D7, exige nova dependência. → S-09 do `sprint.md`
- [ ] Reduced motion emulado no navegador (a regra global cobre `dialog-in`). → S-10 do `sprint.md`

## Bloqueios
- [x] Política de privacidade própria — feita na spec 003; textos revisados e publicados na S-01 (spec 016). (Fechado em 2026-11-22, spec 011.)
- [x] Cache compartilhado em produção — feito: spec 005 (Upstash Redis). (Fechado em 2026-11-22, spec 011.)

## Próxima fatia sugerida — 003-launch-readiness (Fase 4 do PRD)
1. Páginas `privacy` e `terms` (texto a definir com o responsável) e link no rodapé.
2. Open Graph com arte original (`opengraph-image`).
3. Cache compartilhado atrás de `CacheStore` (após escolher provedor).
4. Teste com chave real: quota consumida por atualização, cobertura dos termos, idioma estimado.
