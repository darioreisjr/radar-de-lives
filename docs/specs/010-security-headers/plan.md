# 010 — Plano

1. `next.config.ts`: exportar `securityHeaders`, adicionar `headers()` com `source: "/:path*"` e `poweredByHeader: false`.
2. `tests/security-headers.test.ts`: valores exatos, `Referrer-Policy` que mantém o `Referer`, `Permissions-Policy` sem `fullscreen`/`picture-in-picture`/`encrypted-media`/`autoplay`, ausência de `Cross-Origin-*`, regra aplicada a todas as rotas e `poweredByHeader: false`.
3. Build e `next start` local numa worktree isolada: `curl -sI` em `/`, `/privacy`, `/api/lives`, `/api/lives/abc`, `/opengraph-image`, `/robots.txt`.
4. Navegador no `next start` local: interceptar `fetch` com um item real (miniatura de `i.ytimg.com`) e a revalidação; abrir o player e conferir o iframe e o console.
5. Depois do push autorizado: conferir os cabeçalhos no Preview (`vercel curl`) e, depois do merge, em produção, incluindo o script do Analytics.

Arquivos: `next.config.ts`, `tests/security-headers.test.ts`, `docs/specs/010-security-headers/*`.
Rollback: remover `headers()` e `poweredByHeader`.
