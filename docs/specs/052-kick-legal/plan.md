# 052 — Plano

1. **`app/privacy/page.tsx`:** resumo; nova seção "Uso da API da Kick"; cache (3 min + 10 min); registros técnicos; conteúdo carregado (miniaturas e player da Kick); fornecedor Kick; transferência internacional; retenção; controles; crianças e adolescentes (16 anos). (D1, D2, D3)
2. **`app/terms/page.tsx`:** o serviço; "YouTube, Twitch, Kick e serviços de terceiros"; marcas; conteúdo; uso permitido (re-distribuição, D5); idade e conteúdo (16 anos e selo na Kick, D1, D4); atualidade (cache) e limites das três APIs.
3. **`lib/config/site.ts`:** `disclaimer` com a Kick (D6) e `legal.updatedAt` = `2026-11-27` (D7).
4. **Testes:**
   - `tests/legal-kick.test.ts` (novo): links, 16 anos, marca, re-distribuição, selo na Kick, tempos de cache iguais aos padrões, data;
   - `tests/legal-twitch.test.ts`: 13 → 16 anos, aviso de marca e data;
   - `e2e/platforms.spec.ts`: sem aceite, nenhuma requisição à Kick; depois do aceite, só a miniatura. (CA3)

## Arquivos

- **Alterados:** `app/privacy/page.tsx`, `app/terms/page.tsx`, `lib/config/site.ts`, `tests/legal-twitch.test.ts`, `e2e/platforms.spec.ts`
- **Novo:** `tests/legal-kick.test.ts`

## Publicação

PR em **rascunho**, mesclado no mesmo dia da ativação da Kick (#55).

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`.
