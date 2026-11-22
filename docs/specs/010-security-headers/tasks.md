# 010 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente

- [x] T1 Doc embutida lida (`headers.md`, `poweredByHeader.md`)
- [x] T2 `next.config.ts`: `securityHeaders` exportado, `headers()` com `source: "/:path*"`, `poweredByHeader: false` — D1–D4
- [x] T3 `tests/security-headers.test.ts` (5 testes): valores exatos, Referer mantido, sem restringir recursos do player, sem `Cross-Origin-*`, regra em todas as rotas — D5
- [x] T4 Worktree limpa: `npm ci`, lint ok, typecheck ok, testes 115/115, build ok — CA5
- [x] T5 `next start` local sem chave — CA1, CA2:

  | Rota | Status | Tipo | Cabeçalhos | `x-powered-by` |
  | --- | --- | --- | --- | --- |
  | `/` | 200 | text/html | 5/5 | ausente |
  | `/privacy` | 200 | text/html | 5/5 | ausente |
  | `/api/lives` | 503 (sem chave, esperado) | application/json | 5/5 | ausente |
  | `/api/lives/abc` | 400 (esperado) | application/json | 5/5 | ausente |
  | `/opengraph-image` | 200 | image/png | 5/5 | ausente |
  | `/robots.txt` | 200 | text/plain | 5/5 | ausente |
  | `/sitemap.xml` | 200 | application/xml | 5/5 | ausente |

- [x] T6 Navegador no `next start` local, com `fetch` interceptado (item real `5hd9Vw2qTaw` copiado do cache de produção; **nenhuma chamada ao YouTube pela API**) — CA3, CA4:
  - miniatura `https://i.ytimg.com/vi/5hd9Vw2qTaw/hqdefault.jpg` carregou (480 px de largura);
  - "Assistir aqui" → revalidação simulada (`live`) → "Carregar player" → iframe `https://www.youtube.com/embed/5hd9Vw2qTaw` carregou e exibiu o vídeo; `referrerPolicy="strict-origin-when-cross-origin"`, `allow="encrypted-media; picture-in-picture; fullscreen"`;
  - console: nenhum erro de Permissions-Policy, Referrer ou bloqueio. Única mensagem: `[Vercel Web Analytics] Failed to load script` (esperado fora da Vercel);
  - `document.featurePolicy`: `camera`, `microphone`, `geolocation`, `payment`, `usb`, `browsing-topics` = bloqueados; `fullscreen`, `picture-in-picture`, `encrypted-media`, `autoplay` = liberados;
  - `allowsFeature("fullscreen", "https://www.youtube.com")` = `false` tanto aqui quanto na produção atual **sem** o cabeçalho → comportamento padrão do navegador (o iframe recebe a permissão pelo atributo `allow`), não regressão.
- [x] T7 Push → CI [45014700223](https://github.com/darioreisjr/radar-de-lives/actions/runs/45014700223) verde; Preview `radar-de-lives-q6b37gql7` conferido com `vercel curl`:
  - `/`, `/privacy`, `/opengraph-image` (200) e `/api/lives` (503, Preview sem chave) com os 5 cabeçalhos e sem `x-powered-by`;
  - `Strict-Transport-Security` da Vercel mantido;
  - `/_vercel/insights/script.js` → 200 (Analytics carrega com os cabeçalhos novos) — CA4
- [x] T7b PR aberto para `main`
- [x] T8 Produção conferida em 2026-11-22 — CA1–CA4:
  - 7 rotas (`/`, `/privacy`, `/terms`, `/api/lives`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`) com 5/5 cabeçalhos, sem `x-powered-by` nem `Cross-Origin-*`, e HSTS mantido;
  - Analytics `/873175f0f7736088/script.js` e `/view` com 200; miniaturas de `i.ytimg.com` carregando;
  - player com revalidação simulada (sem quota) carregou o iframe do YouTube; console sem mensagens.

  Detalhes na seção S-05 do `sprint.md`.
