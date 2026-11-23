# 017 — Plano

## Etapa A (Report-Only)
- `next.config.ts`: exporta `contentSecurityPolicy` e acrescenta `Content-Security-Policy-Report-Only` a `securityHeaders`. A regra `/:path*` não muda.
- `tests/security-headers.test.ts`:
  - os 5 cabeçalhos da S-05 continuam exatos;
  - testes novos verificam diretiva por diretiva;
  - nenhum curinga, nenhum esquema solto, nenhum `unsafe-eval` em produção.
- e2e:
  - a fixture falha o teste em qualquer mensagem de CSP no console;
  - um listener de `securitypolicyviolation` reforça o console;
  - os envios de visita do Analytics são simulados;
  - `E2E_BASE_URL` roda a suíte contra um deploy.
- Verificação em produção depois do merge:
  1. e2e contra produção (API simulada, sem quota).
  2. Uma visita real, sem simulação, com dados da API e o iframe real do YouTube, contando as violações. Custa no máximo 1 `search.list`, e só se o cache de 15 min tiver expirado.

## Etapa B (aplicada)
- `securityHeaders`: `Content-Security-Policy` recebe a política completa e o Report-Only é removido.
- Mesma verificação: e2e local, e2e contra produção e visita real.

## Rollback
- **Instant Rollback** da Vercel para o deploy anterior, depois `git revert` do PR.
- A etapa A é inócua por definição: Report-Only não bloqueia nada.
