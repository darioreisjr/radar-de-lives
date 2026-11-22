# 004 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente · [!] bloqueado
Última atualização: 2026-11-22

- [x] T1 Ler resultados reais do cache (sem gastar quota) e registrar observações (§2 da spec)
- [x] T2 Conferir UI com dados reais: 50 cards, miniaturas, "do cache", "Carregar mais", sem rolagem horizontal
- [x] T3 Calibrar `inferLanguage` (D1–D5) + 6 testes novos com títulos sintéticos — CA1–CA5
- [x] T4 Reaplicar aos 50 itens observados: 4 mudanças corretas, nenhum pt/es alterado — CA6
- [x] T5 lint ok · typecheck ok · testes 91/91 · build ok · chave real 0× em `.next/static` e `.next/server/app` — CA7

## Pendente (depende do usuário)
- [x] Quota real por atualização — conferida nos logs de produção da Vercel (não no `npm run dev`). Em 2026-11-22 houve 4 buscas novas, às 10:04, 10:19, 10:34 e 10:50 UTC. Cada uma gastou exatamente 1 `search.list` (`page: first`, `budgetUsed` de 1 a 4 de 90) e 1 `videos.list` com 50 IDs. (Fechado em 2026-11-22, spec 011.)
- [ ] Testar "Assistir aqui" com uma live real (1 unidade de `videos.list`). Segundo o `sprint.md`, foi feito em produção, mas os logs disponíveis (desde 2026-11-22 10:04 UTC) não têm `videos.list` de 1 ID. Fica aberto até haver registro (spec 011).
- [ ] "Carregar mais" com dados reais (gasta 1 `search.list` do limite de 100/dia). Segundo o `sprint.md`, foi feito em produção, mas os logs disponíveis não têm `search.list` com `page: next`. Fica aberto até haver registro (spec 011).

## Pendências de lançamento (herdadas da 003; resolvidas em 2026-11-22, ver 003 e spec 011)
- Responsável/contato em `siteConfig.legal` + revisão jurídica → S-01 (spec 016).
- `NEXT_PUBLIC_SITE_URL` e nome/domínio finais → `radardelives.darioreis.dev`.
- Instância única ou cache compartilhado → Upstash (spec 005).
