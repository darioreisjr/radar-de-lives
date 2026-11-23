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
- [x] Fluxo com chave real e live real (2026-11-23): em produção, sem simulação, "Assistir aqui" chamou `/api/lives/<id>` (200) e "Carregar player" abriu o iframe `https://www.youtube.com/embed/<id>?playsinline=1&rel=0` (spec 017, T8 e T10b)
- Limitação aceita, não é pendência: erros dentro do player (Content ID, região) não são detectados pelo app (D8); só o link de fallback.
- [x] Testes de interface automatizados (2026-11-23): Playwright, 46 testes (spec 014 / S-09)
- [x] Reduced motion emulado no navegador (2026-11-23): `dialog-in` com 0,01 ms (spec 015, caso 9; spec 014)

## Bloqueios
- [x] Política de privacidade própria — feita na spec 003; textos revisados e publicados na S-01 (spec 016). (Fechado em 2026-11-22, spec 011.)
- [x] Cache compartilhado em produção — feito: spec 005 (Upstash Redis). (Fechado em 2026-11-22, spec 011.)

## Próxima fatia sugerida — 003-launch-readiness (Fase 4 do PRD)
1. Páginas `privacy` e `terms` (texto a definir com o responsável) e link no rodapé.
2. Open Graph com arte original (`opengraph-image`).
3. Cache compartilhado atrás de `CacheStore` (após escolher provedor).
4. Teste com chave real: quota consumida por atualização, cobertura dos termos, idioma estimado.
