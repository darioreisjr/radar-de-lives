# 012 — robots.txt e sitemap.xml

Tarefa S-07 do [sprint.md](../../../sprint.md). Branch `sprint/012-seo-robots-sitemap`.

## Contexto

O site não tinha `robots.txt` nem `sitemap.xml`. Buscadores não sabiam quais páginas indexar e podiam rastrear `/api/*`, que consome a quota do YouTube quando o cache expira.

## Objetivo

Gerar os dois arquivos pelas convenções de metadados do App Router (doc embutida: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md` e `sitemap.md`).

## Escopo

Incluído: `app/robots.ts`, `app/sitemap.ts`, `tests/seo.test.ts`, esta spec.
Excluído: envio ao Google Search Console (usuário, depois do deploy); páginas novas; mudanças em `app/layout.tsx`.

## Requisitos

- **R1** `robots.txt`: `User-Agent: *`, `Allow: /`, `Disallow: /api/`, `Sitemap: <origem>/sitemap.xml`.
- **R2** `sitemap.xml`: `/` (`hourly`), `/privacy` e `/terms` (`monthly`), URLs absolutas.
- **R3** Origem: `NEXT_PUBLIC_SITE_URL`, senão `siteConfig.url`. Valor inválido também cai em `siteConfig.url`.
- **R4** Rotas estáticas: nenhuma API de requisição nem `new Date()`.

## Decisões

- **D1** Diferente de `app/layout.tsx`, a alternativa `siteConfig.url` vale em qualquer ambiente (não só em produção): robots e sitemap exigem URL absoluta. No Preview (sem a variável) as URLs apontam para o domínio de produção, o que é o desejado para um sitemap.
- **D2** `lastModified` das páginas legais = `siteConfig.legal.updatedAt` (data real da última mudança do texto). A home não tem `lastModified`: ela muda o tempo todo e um carimbo de build seria enganoso.
- **D3** `priority`: 1 para a home e 0,3 para as legais (dica opcional; buscadores podem ignorar).
- **D4** `siteOrigin()` fica exportada de `app/sitemap.ts` e é reusada por `app/robots.ts`, para não criar arquivo fora da lista permitida.

## Critérios de aceite

1. **CA1** `npm run build` lista `/robots.txt` e `/sitemap.xml` como estáticas (`○`).
2. **CA2** Em `next start`, `/robots.txt` contém `Disallow: /api/` e `Sitemap: https://radardelives.darioreis.dev/sitemap.xml` (com `NEXT_PUBLIC_SITE_URL` no build); `/sitemap.xml` lista as 3 URLs absolutas no domínio final.
3. **CA3** Nenhuma página privada ou de API no sitemap.
4. **CA4** lint, typecheck, testes e build verdes.

## Depois do deploy (usuário)

Opcional: enviar `https://radardelives.darioreis.dev/sitemap.xml` no Google Search Console.
