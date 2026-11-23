# 014 — Plano

## Abordagem

- `playwright.config.ts`: `webServer` faz `npm run build && npm run start -- -p 3100 -H 127.0.0.1` com `YOUTUBE_API_KEY=""`; projetos `desktop` e `mobile-375`; `locale` pt-BR.
- `e2e/support.ts`: fixture automática que
  - simula `/api/lives` (fila de respostas) e `/api/lives/<id>` (função por vídeo) com `ApiMock`;
  - aborta e registra qualquer outra rota de `/api/`;
  - responde localmente `i.ytimg.com` (PNG 1×1) e `www.youtube.com` (HTML simples);
  - grava o aceite da política no `localStorage` (opção `acceptPolicy`, padrão `true`);
  - no fim de cada teste, falha se houve chamada a `googleapis.com` ou rota de `/api/` não simulada.
- Specs: `home`, `states`, `player`, `keyboard-motion`.

## Arquivos

- `package.json` (`devDependencies` e script `test:e2e`), `package-lock.json`
- `playwright.config.ts`, `e2e/*.ts`
- `.gitignore` (`/test-results/`, `/playwright-report/`, `/blob-report/`, `/playwright/.cache/`)
- `docs/specs/014-ui-tests/*`

## Verificação

- `npm run test:e2e` nas duas larguras.
- Teste de mutação (sem commit): quebrar o código de propósito e conferir que a suíte falha.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- CI e Preview da Vercel verdes no PR (o build da Vercel instala devDependencies, então precisa continuar compilando).

## Riscos e rollback

- Sem risco para produção: só devDependencies e arquivos de teste; o bundle não muda.
- Rollback: reverter o PR.
