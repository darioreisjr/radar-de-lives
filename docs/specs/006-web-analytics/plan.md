# 006 — Plano

1. `npm i @vercel/analytics@^2.0.1`; conferir bindings do rolldown no lockfile (CLAUDE.md).
2. `lib/analytics.ts`: `stripQuery(event)` pura (D2).
3. `app/layout.tsx`: `<Analytics beforeSend={stripQuery} />` após `{children}`.
4. `app/privacy/page.tsx`: seção "Estatísticas de visitas" e ajuste do resumo (D3).
5. Teste `tests/analytics.test.ts`.
6. lint, typecheck, testes, build; commit e push; conferir script na produção.
