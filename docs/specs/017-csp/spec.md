# 017 — Política de segurança de conteúdo (CSP)

Tarefa S-12 do [sprint.md](../../../sprint.md). Branches `sprint/017-csp` (etapa A, Report-Only) e `sprint/017-csp-enforce` (etapa B, aplicada).

## Contexto

Desde a S-05, a única CSP é `frame-ancestors 'none'`. Uma CSP completa reduz o impacto de XSS, mas pode quebrar o player, as miniaturas, o Analytics e os scripts do Next. Decisão (2026-11-23): executar a S-12 em duas etapas.

## Política

```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://i.ytimg.com; font-src 'self'; connect-src 'self';
frame-src https://www.youtube.com; object-src 'none'; base-uri 'self'; form-action 'self';
frame-ancestors 'none'
```

`'unsafe-eval'` só no `next dev`, exigido pelo React em desenvolvimento.

## Decisões

- **D1 Sem nonce.** O guia `content-security-policy.md` do Next 16 diz que o nonce exige renderização dinâmica em todas as páginas e é incompatível com o prerender parcial. Isso tiraria o cache de CDN de `/`, `/privacy` e `/terms`. Por isso `script-src` usa `'self' 'unsafe-inline'`.
  - **Ganho real mesmo assim:** nenhum script de outro domínio, `object-src 'none'`, `base-uri` e `form-action` travados, imagens só de `i.ytimg.com`, iframes só de `www.youtube.com`, conexões só ao próprio domínio (exfiltração por `fetch` bloqueada).
  - **Limite aceito:** um XSS com script inline continuaria executando. O React escapa tudo e o código não usa `dangerouslySetInnerHTML`, então o risco residual é baixo.
  - **SRI experimental** (`experimental.sri`) avaliado e não usado: é experimental e não cobre os scripts inline do Next.
- **D2 Sem `upgrade-insecure-requests`.** A Vercel já força HTTPS (HSTS), e a diretiva quebraria o `next start` local em `http://`.
- **D3 Sem `report-uri`.** O projeto não tem endpoint de relatórios. As violações aparecem no console do navegador e são capturadas pelo e2e.
- **D4 Etapas.**
  - **A:** `Content-Security-Policy-Report-Only` com a política completa, mantendo a `Content-Security-Policy: frame-ancestors 'none'` aplicada.
  - **B:** depois de zero violações em produção, a política completa passa a ser a `Content-Security-Policy` aplicada, e o Report-Only sai.
- **D5 Arquivos fora da lista do sprint**, necessários para a verificação:
  - `tests/security-headers.test.ts`: a política agora faz parte dos cabeçalhos testados.
  - `playwright.config.ts` e `e2e/support.ts` (spec 014): detector de violações e `E2E_BASE_URL` para rodar contra produção.

## Critérios de aceite

1. **CA1** Em Report-Only, nenhuma violação em: home, aceite, filtros, "Carregar mais", player com consentimento, páginas legais, OG e Analytics.
2. **CA2** A versão aplicada só entra depois do CA1 em produção.
3. **CA3** Páginas estáticas continuam estáticas (`○` no build).
4. **CA4** lint, typecheck, Vitest, e2e e build verdes; o e2e falha se houver violação.
