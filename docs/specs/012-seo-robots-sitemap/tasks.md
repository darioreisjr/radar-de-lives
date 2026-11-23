# 012 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente

- [x] T1 `app/sitemap.ts` com `siteOrigin()` e as 3 páginas — R2, R3
- [x] T2 `app/robots.ts` com `Disallow: /api/` e link do sitemap — R1
- [x] T3 `tests/seo.test.ts`: 4 testes, todos passando
- [x] T4 lint ok · typecheck ok · testes da base 106 + 4 novos = 110, todos passando · build ok com `○ /robots.txt` e `○ /sitemap.xml` — CA1, CA4
- [x] T5 `next start` (build com `NEXT_PUBLIC_SITE_URL` de produção): `/robots.txt` → 200 `text/plain` com `Disallow: /api/` e `Sitemap: https://radardelives.darioreis.dev/sitemap.xml`; `/sitemap.xml` → `/`, `/privacy`, `/terms` absolutas no domínio final, sem `/api` — CA2, CA3
- [x] T6 Conferido em produção em 2026-11-22. `https://radardelives.darioreis.dev/robots.txt` tem `Disallow: /api/` e `Sitemap: https://radardelives.darioreis.dev/sitemap.xml`. `/sitemap.xml` lista `/`, `/privacy` e `/terms` no domínio final. (Spec 011.)
- [x] T7 (Usuário) Sitemap enviado ao Google Search Console em 2026-11-23, com sucesso. Propriedade verificada pelo arquivo `public/googleae0552e8a704d280.html` (PR #23), que deve continuar publicado

Nota: no momento da verificação havia arquivos não rastreados de outra tarefa (`components/consent/`, `lib/consent/`, `tests/policy-acceptance.test.ts`, 7 testes). Eles rodaram junto (117 no total), mas não fazem parte deste commit.
