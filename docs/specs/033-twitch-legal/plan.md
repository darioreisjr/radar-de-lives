# 033 — Plano

## Passos

1. **`app/privacy/page.tsx`:** constantes `TWITCH_PRIVACY` e `TWITCH_TERMS` e os trechos da seção "Escopo" da spec.
2. **`app/terms/page.tsx`:** os mesmos links e os trechos da spec, incluindo a seção "Idade e conteúdo".
3. **`lib/config/site.ts`:** `disclaimer` com a Twitch e `legal.updatedAt` = `2026-11-25`.
4. **Testes:**
   - `tests/legal-twitch.test.ts` (novo): links, 13 anos, aviso de marca, tempos de cache iguais aos padrões de `getServerEnv`, data;
   - `e2e/platforms.spec.ts`: sem aceite, nenhuma requisição à Twitch; depois do aceite, a miniatura carrega.

## Arquivos

- **Alterados:** `app/privacy/page.tsx`, `app/terms/page.tsx`, `lib/config/site.ts`, `e2e/platforms.spec.ts`
- **Novo:** `tests/legal-twitch.test.ts`

`components/consent/policy-gate.tsx` não precisou mudar: ele já bloqueia a lista inteira antes do aceite, inclusive as miniaturas da Twitch (provado pelo e2e).

## Publicação

PR em **rascunho**, mesclado no mesmo dia da ativação da Twitch (#47). Se a data mudar, atualizar `updatedAt` e o teste.

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`.
