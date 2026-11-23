# 014 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente

- [x] T1 `@playwright/test` 1.65.0 instalado; lockfile com só 3 pacotes novos e as 17 bindings do rolldown mantidas; `npm ci` ok — CA4 (D1, D4)
- [x] T2 Chromium do Playwright instalado (`chromium-headless-shell` v1254)
- [x] T3 `playwright.config.ts` e `e2e/support.ts` (servidor sem chave, API simulada, Google bloqueado) — R1, R2
- [x] T4 `e2e/home.spec.ts`: aceite e recusa da política, radar (total 6, idiomas pt 3 / en 2 / es 1), um único botão rosa, sem rolagem horizontal, filtros, "Carregar mais" (`?pageToken=PAGINA2`), links de `/privacy` — R3.1, R3.6
- [x] T5 `e2e/states.spec.ts`: quota 503, 502 sem itens + "Tentar novamente", 502 com itens (grade mantida e cooldown), stale, vazio, sem conexão — R3.2
- [x] T6 `e2e/player.spec.ts`: iframe `embed/<id>?playsinline=1&rel=0` sem autoplay e com `referrerpolicy`; `ended`, `upcoming`, `unavailable`, `embedAllowed:false`; card atualizado depois de "ended"; falha da revalidação; incorporação desativada na lista — R3.3
- [x] T7 `e2e/keyboard-motion.spec.ts`: Tab até filtros e "Assistir aqui", Enter abre, Esc fecha e devolve o foco; movimento reduzido (cards, hero, pulso, diálogo ≈ 0 ms) com teste de controle (240 ms, `infinite`) — R3.4, R3.5
- [x] T8 `npm run test:e2e`: **46/46** (23 testes × desktop e 375 px) em 28,8 s — CA1, CA2 (a fixture falha o teste se houver `googleapis.com` ou `/api/` não simulada)
- [x] T9 Teste de mutação (sem commit), em desktop: `autoplay=1` no `embedSrc`, regra de movimento reduzido trocada para 0,3 s e título do estado de quota alterado → **3 falhas**, uma em cada teste esperado; código restaurado — confirma que os testes não são vazios
- [x] T10 lint ok, typecheck ok (inclui `e2e/` e `playwright.config.ts`), Vitest **122/122** (igual à linha de base), build com a mesma tabela de rotas (`○` em `/`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, `/opengraph-image`) — CA3, CA4
- [x] T11 PR #17: CI e Preview da Vercel verdes; merge `eee19e2`; CI do `main` e deploy de produção `success`; smoke de produção ok
- [ ] T12 Job `e2e` no CI (depois do `verify`): verde no PR e no `main`
