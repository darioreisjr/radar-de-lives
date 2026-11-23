# 017 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente

## Etapa A — Report-Only
- [x] T1 Guia de CSP do Next 16 lido (nonce exige renderização dinâmica e é incompatível com PPR; SRI experimental) — D1
- [x] T2 `contentSecurityPolicy` e `Content-Security-Policy-Report-Only` em `next.config.ts`
- [x] T3 Testes unitários: os 5 cabeçalhos da S-05 continuam exatos e há 4 testes novos da CSP; Vitest **129/129**
- [x] T4 Detector de violações no e2e. Mutação: `i.ytimg.com` removido do `img-src` → o e2e falhou com "violates the following Content Security Policy directive … report-only"; política restaurada
- [x] T5 e2e local **46/46** sem violações (home, aceite, recusa, filtros, Carregar mais, estados, player com iframe, teclado, `/privacy`, `/terms`) — CA1 local
- [x] T6 lint ok, typecheck ok, build com a mesma tabela (`○` em `/`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, `/opengraph-image`) — CA3, CA4
- [x] T7 `E2E_BASE_URL=https://radardelives.darioreis.dev`: **46/46** contra a produção anterior (modo validado)
- [ ] T8 PR, CI e Preview; merge; produção: e2e contra produção + visita real sem simulação — CA1

## Etapa B — aplicada
- [ ] T9 Política completa como `Content-Security-Policy`, sem Report-Only — CA2
- [ ] T10 e2e local, e2e contra produção e visita real sem violações
