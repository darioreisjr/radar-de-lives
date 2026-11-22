# 005 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente · [!] bloqueado
Última atualização: 2026-11-21

- [x] T0 `@upstash/redis@^1.41.0` (publicado em 2026-11-02); nomes de variáveis (`UPSTASH_REDIS_REST_*` e `KV_REST_API_*`) e retorno `"OK" | null` do `SET NX` confirmados no código-fonte instalado
- [x] T1 `lib/store`: interfaces `Counter`/`Lock`, memória e Upstash (prefixo `radar:v1:`, erros viram `StoreError` sem mensagem original) — CA1, CA6
- [x] T2 Orçamento diário e rate limit assíncronos sobre `Counter`; rate limit com HMAC do IP — CA3, CA4
- [x] T3 Serviço de lives: trava compartilhada substitui `lastUpstreamAt`; espera até ~3 s por cache novo; falha fechada — CA2, CA5
- [x] T4 Revalidação com orçamento compartilhado e falha fechada
- [x] T5 `server.ts` (runtime único por instância), rotas com `await`, `server-env`, telemetria `store_error`/`store_memory_in_production` — RF1, RF2
- [x] T6 `/privacy` (Upstash, HMAC do IP, Vercel), README (deploy), `.env.example`, CLAUDE.md — RF5, RF6
- [x] T7 lint ok · typecheck ok · testes 100/100 · build ok · chave do YouTube e dados do Upstash 0× em `.next/static` — CA7, CA8
- [x] T7b `next start` com Upstash inalcançável: `/api/lives` e `/api/lives/[id]` → 502 em ~0,4 s, sem `youtube_call`; rate limit falhou aberto; nenhum segredo no log
- [x] T8 Commits em Conventional Commits pt-BR, sem coautor

## Achados na verificação
- `npm install` removeu as bindings do rolldown do lockfile (npm/cli#4828). Lockfile regenerado: só `@upstash/redis` entrou; 0 de 492 pacotes mudou de versão.
- Mensagem "O YouTube não respondeu" era imprecisa quando a falha é do store → "A busca não respondeu a tempo".

## Deploy em produção (verificado em 2026-11-21)
- [x] Projeto `radar-de-lives` na Vercel, ligado ao GitHub `darioreisjr/radar-de-lives`; domínio `radardelives.darioreis.dev` com HTTPS/HSTS.
- [x] Upstash conectado pelo Marketplace: variáveis `KV_REST_API_URL`/`KV_REST_API_TOKEN` (aceitas pelo código).
- [x] Variáveis: `YOUTUBE_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `RATE_LIMIT_SECRET`.
- [x] `/`, `/privacy`, `/terms`, `/opengraph-image` → 200; `og:image` no domínio final.
- [x] `/api/lives`: 50 itens, `cached: true` em chamadas repetidas.
- [x] Logs: um único `youtube_call` (`search.list`, `budgetUsed: 1/90`, + `videos.list` com 50 IDs) após o redeploy; demais requisições, de hosts diferentes, servidas do cache compartilhado; nenhum `store_error` nem `store_memory_in_production`; nenhum segredo nos logs.
- [x] Aliases `*.vercel.app` respondem 302 (Proteção de Deploy da Vercel) — esperado.

## Recomendações pendentes (decisão do usuário)
- [ ] Remover `YOUTUBE_API_KEY` do ambiente **Preview** (hoje em Production e Preview). O orçamento é compartilhado no Upstash, mas deploys de branches gastariam a mesma quota.
- [ ] Restrição de API da chave no Google Cloud: só "YouTube Data API v3" (a Vercel não tem IP fixo, então a restrição de aplicativo fica "Nenhuma").
