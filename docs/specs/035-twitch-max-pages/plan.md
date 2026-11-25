# 035 — Plano

## Passos

1. **`lib/twitch/search.ts`:** `TWITCH_DEFAULT_MAX_PAGES = 1` como padrão de `maxPages`. (D3)
2. **`lib/config/server-env.ts`:** `twitchMaxPages: int("TWITCH_MAX_PAGES", 1, 1, 3)`. (D1, D2)
3. **`lib/lives/server.ts`:** passa `maxPages: env.twitchMaxPages` e inclui o valor na assinatura do runtime. (D4)
4. **`.env.example`:** documenta a variável.
5. **Testes:**
   - `tests/twitch-normalize.test.ts`: padrão de 1 página mesmo com cursor (CA1); os testes de várias páginas passam `maxPages: 3` (CA2);
   - `tests/twitch-service.test.ts`: leitura da variável, com padrão, faixa e texto inválido (CA3).

## Arquivos

- **Alterados:** `lib/twitch/search.ts`, `lib/config/server-env.ts`, `lib/lives/server.ts`, `.env.example`, `tests/twitch-normalize.test.ts`, `tests/twitch-service.test.ts`

## Publicação

Merge → deploy automático em produção. Sem mudança no painel da Vercel (o padrão já é 1). Conferir CA5 na produção depois do deploy.

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`.
