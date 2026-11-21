# 001 — Plano técnico

## Abordagem

- Base criada com `create-next-app@16.4.6` (npm, App Router, TS, Tailwind 4, ESLint, sem `src/`, alias `@/*`). Config padrão mantida (`cacheComponents: true`).
- Route Handler `app/api/lives/route.ts` lê `request.nextUrl`, então roda por requisição (doc embutida do Next 16.4: com Cache Components, acesso a dados de requisição interrompe o prerender). O cache de quota é um módulo explícito (`lib/cache`), não `use cache`, porque precisamos de stale-on-error, orçamento e single-flight.
- Serviço puro e testável: `lib/youtube/service.ts` recebe `fetch`, `now` e cache por injeção; a rota só valida, chama o serviço e mapeia erros.
- Página `app/page.tsx` (Server Component) renderiza layout estático e o componente cliente `LiveExplorer`, que busca `/api/lives`, mantém os itens acumulados e aplica filtros localmente.

## Arquivos

```
app/layout.tsx, app/page.tsx, app/globals.css, app/api/lives/route.ts
components/layout/site-header.tsx, site-footer.tsx
components/hero/hero-section.tsx
components/lives/live-explorer.tsx (client; inclui a grade), live-card.tsx,
  live-card-skeleton.tsx, live-filters.tsx, refresh-status.tsx,
  states.tsx (Empty/Error/Quota/Setup)
components/ui/button.tsx, badge.tsx, radar-mark.tsx
lib/config/site.ts, lib/config/server-env.ts
lib/youtube/types.ts, searches.ts, client.ts, normalize.ts, service.ts, errors.ts
lib/cache/types.ts, memory-cache.ts
lib/rate-limit/memory-rate-limit.ts
lib/validation/lives-query.ts
lib/lives/filter.ts (filtro/ordenação puros, usados no servidor e cliente)
lib/utils/format.ts, infer-language.ts
lib/fixtures/lives.ts
lib/lives/server.ts (singletons do processo)
tests/*.test.ts, vitest.config.mts, scripts/test.mjs
.env.example, README.md, CLAUDE.md
```

Desvio da estrutura sugerida no PRD: `lib/cache/redis-cache.ts` não é criado agora (sem infraestrutura); a interface `CacheStore` documenta a substituição. `hooks/` não é criado: a lógica de cliente cabe em `live-explorer.tsx` nesta fatia.

## Sequência

1. Artefatos SDD, PRD e skill no repositório.
2. Tokens, fontes, layout, header/hero/footer.
3. Tipos, validação, normalização, deduplicação, inferência de idioma + testes.
4. Cache em memória, rate limit, cliente YouTube com timeout/retry, serviço + testes.
5. Route Handler e `.env.example`.
6. UI cliente: status, filtros, grade, cards, estados, fixtures.
7. Verificação: lint, typecheck, testes, build, inspeção do bundle, navegador em 375/1440 px se disponível.

## Variáveis de ambiente

`YOUTUBE_API_KEY`, `LIVE_CACHE_TTL_SECONDS=900`, `LIVE_STALE_TTL_SECONDS=600`, `LIVE_RATE_LIMIT_SECONDS=30`, `YOUTUBE_DEFAULT_REGION=BR`, `YOUTUBE_DEFAULT_LANGUAGE=pt`, `YOUTUBE_SEARCH_DAILY_BUDGET=90`, `NEXT_PUBLIC_SITE_URL`. `REDIS_URL` fica documentado como futuro, sem uso.

## Verificação

- `npm run lint`, `npm run typecheck` (`tsc --noEmit`), `npm test` (Vitest), `npm run build`.
- `curl` na rota: sem chave (503), parâmetros inválidos (400).
- `grep` da chave de teste em `.next/static` após build com chave fictícia.
- Navegador (Claude in Chrome) em 375 e 1440 px, se a extensão estiver conectada.

## Riscos e rollback

Mudanças isoladas em arquivos novos; rollback = remover arquivos. Sem migrações.
