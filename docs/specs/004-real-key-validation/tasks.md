# 004 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente · [!] bloqueado
Última atualização: 2026-11-21

- [x] T1 Ler resultados reais do cache (sem gastar quota) e registrar observações (§2 da spec)
- [x] T2 Conferir UI com dados reais: 50 cards, miniaturas, "do cache", "Carregar mais", sem rolagem horizontal
- [x] T3 Calibrar `inferLanguage` (D1–D5) + 6 testes novos com títulos sintéticos — CA1–CA5
- [x] T4 Reaplicar aos 50 itens observados: 4 mudanças corretas, nenhum pt/es alterado — CA6
- [x] T5 lint ok · typecheck ok · testes 91/91 · build ok · chave real 0× em `.next/static` e `.next/server/app` — CA7

## Pendente (depende do usuário)
- [ ] Conferir quota real por atualização nos logs `youtube_call` do terminal do `npm run dev` (esperado: 1 `search.list` + 1 `videos.list`).
- [ ] Testar "Assistir aqui" com uma live real (1 unidade de `videos.list`).
- [ ] "Carregar mais" com dados reais (gasta 1 `search.list` do limite de 100/dia).

## Pendências de lançamento (herdadas da 003)
- Responsável/contato em `siteConfig.legal` + revisão jurídica.
- `NEXT_PUBLIC_SITE_URL` e nome/domínio finais.
- Instância única ou cache compartilhado.
