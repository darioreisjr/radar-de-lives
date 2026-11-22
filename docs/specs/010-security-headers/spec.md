# 010 — Cabeçalhos de segurança HTTP

Status: em andamento · Data: 2026-11-22
Fonte: [sprint.md — S-05](../../../sprint.md#s-05--cabeçalhos-de-segurança-http).

## 1. Contexto

Em produção só existe `Strict-Transport-Security`, adicionado pela Vercel, e o Next envia `X-Powered-By: Next.js`. O site embute o player do YouTube (que exige o `Referer`), carrega miniaturas de `i.ytimg.com` e o script do Vercel Web Analytics no próprio domínio.

## 2. Objetivo

Aplicar a todas as rotas, via `headers()` em `next.config.ts`, cinco cabeçalhos de segurança e desligar `X-Powered-By`, sem quebrar player, miniaturas, Analytics, API e imagem Open Graph.

## 3. Fatos confirmados (doc embutida do Next 16.4, 2026-11-22)

| Fonte | Fato |
| --- | --- |
| `headers.md` | `headers()` (síncrona ou assíncrona) devolve `{ source, headers: [{ key, value }] }`. `source: '/:path*'` casa todas as rotas. Cabeçalhos são aplicados antes do sistema de arquivos (páginas e `/public`). Em chaves repetidas, vale a última regra. |
| `headers.md` | `Cache-Control` de assets imutáveis não pode ser sobrescrito (não usamos). |
| `poweredByHeader.md` | `poweredByHeader: false` remove `x-powered-by`. |
| Spec 002 / RMF do YouTube | O player precisa do `Referer`; recomendado `strict-origin-when-cross-origin`. O iframe usa `encrypted-media`, `picture-in-picture` e `fullscreen`. |

## 4. Decisões

- **D1 — Cabeçalhos** (todas as rotas, `source: "/:path*"`):
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: frame-ancestors 'none'` (só esta diretiva; a CSP completa é a S-12)
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()`
- **D2 — Não restringir** `fullscreen`, `picture-in-picture`, `encrypted-media` e `autoplay` na `Permissions-Policy`, porque são usados pelo iframe do YouTube.
- **D3 — Não usar** `Cross-Origin-Embedder-Policy` nem `Cross-Origin-Opener-Policy: same-origin`, que podem bloquear o iframe e as miniaturas.
- **D4 — `poweredByHeader: false`.**
- **D5 — Lista de cabeçalhos exportada** de `next.config.ts` (`securityHeaders`) e coberta por teste, para impedir regressões (por exemplo, trocar o `Referrer-Policy` ou restringir `fullscreen`).

## 5. Critérios de aceite

1. **CA1** Em `next start` local, `curl -sI /` mostra os 5 cabeçalhos e não mostra `x-powered-by`.
2. **CA2** Em `/api/lives` e `/opengraph-image` os cabeçalhos também aparecem e as respostas continuam corretas.
3. **CA3** Player: "Assistir aqui" → "Carregar player" carrega o iframe de `https://www.youtube.com/embed/...`, sem gastar quota (fetch interceptado), e o console não tem erro de `Permissions-Policy` ou `Referrer`.
4. **CA4** Miniaturas de `i.ytimg.com` e o script do Analytics continuam carregando (Analytics só existe na Vercel: verificado em Preview ou produção).
5. **CA5** lint, typecheck, testes e build verdes.

## 6. Fora do escopo

- CSP completa (S-12).
- `Cross-Origin-*` e HSTS (o HSTS já vem da Vercel).
