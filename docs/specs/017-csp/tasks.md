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
- [x] T8 PR #20: CI e Preview verdes; merge e deploy `success`. Produção (2026-11-23) — CA1:
  - cabeçalho `Content-Security-Policy-Report-Only` presente; smoke das 6 rotas ok;
  - e2e contra produção: **46/46**, zero violações;
  - visita real sem simulação (dados da API, miniaturas e iframe reais): "50 lives encontradas", 32 miniaturas de `i.ytimg.com` carregadas, iframe `https://www.youtube.com/embed/<id>?playsinline=1&rel=0` carregado, Analytics `/873175f0f7736088/script.js` 200, `/opengraph-image` 200, `/privacy` e `/terms` abertas; **0 violações** e 0 erros no console

## Etapa B — aplicada
- [x] T9 Política completa como `Content-Security-Policy`, sem Report-Only; testes unitários ajustados (129/129) — CA2
- [x] T9b Mutação no modo aplicado: `frame-src 'none'` → o e2e do player falhou com "Framing 'https://www.youtube.com/' violates … The request has been blocked."; política restaurada
- [x] T10a e2e local **46/46** sem violações; lint, typecheck ok; build com as mesmas 8 rotas `○` — CA3, CA4
- [x] T10b PR #21: CI e Preview verdes; merge `6943730`; deploy `success`. Produção: `Content-Security-Policy` completa, sem Report-Only; smoke das 6 rotas ok; e2e contra produção **46/46**; visita real (50 lives, 32 miniaturas, iframe do YouTube, Analytics 200, OG 200) com **0 violações** e 0 erros
