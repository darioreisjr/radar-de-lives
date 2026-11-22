# 011 — Atualizar a documentação desatualizada

Tarefa S-06 do [sprint.md](../../../sprint.md). Branch `sprint/011-docs-cleanup`.

## Contexto

Vários itens `[ ]` e `[!]` dos `tasks.md` foram resolvidos depois, em outras specs ou em produção, mas continuavam
abertos. O README ainda listava como pendentes a revisão dos textos legais e a restrição da chave, já concluídas.

## Objetivo

Cada item aberto em `docs/specs` deve ser uma pendência real, apontando para uma tarefa do `sprint.md`. Cada item
fechado deve trazer a evidência. Nenhuma afirmação nova sem evidência e nenhuma alteração de código.

## Escopo

- `tasks.md` das specs 001 a 005 (lista da S-06).
- **Fora da lista original, autorizado pelo usuário em 2026-11-22:** `tasks.md` das specs 008, 012 e 016.
- `README.md` (Pendências, Desenvolvimento, uma linha em Funcionalidades) e `CLAUDE.md` (uma linha).

## Evidências usadas

| Evidência | Como foi obtida (2026-11-22) |
| --- | --- |
| 50 itens reais do YouTube | spec 004 §2 |
| Contraste medido | `tests/contrast.test.ts` (spec 003 T2) |
| `next start` sem chave | spec 003 T7 |
| Cache compartilhado | spec 005 (Upstash), deploy verificado |
| Domínio | `siteConfig.url` = `https://radardelives.darioreis.dev` |
| `YOUTUBE_API_KEY` só em Production | `vercel env ls` (só nomes e ambientes; nenhum valor lido) |
| Restrição da chave | S-03, seção "Resultado" do `sprint.md` |
| Quota por atualização | Logs de produção (`vercel logs --environment production --query youtube_call`). Houve 4 buscas novas, às 10:04, 10:19, 10:34 e 10:50 UTC, cada uma com 1 `search.list` (`page: first`) e 1 `videos.list` de 50 IDs. |
| `robots.txt` e `sitemap.xml` em produção | `curl` no domínio final |
| Textos legais revisados | S-01 do `sprint.md`, PR #5 |

## Divergências com o `sprint.md`

O `sprint.md` dá como feitos em produção três itens:

- o "Fluxo com chave e live real" da 002 (`videos.list` de 1 ID após "Assistir aqui");
- o "Assistir aqui" da 004;
- o "Carregar mais" da 004 (`search.list` com `page: next`).

A evidência citada é a "conversa de deploy", que não está no repositório. Os logs da Vercel disponíveis começam em
2026-11-22 às 10:04 UTC e não mostram essas chamadas. Por decisão do usuário, os três **ficam abertos com nota** e
sem gastar quota.

Exceção ao critério 1: esses três itens continuam abertos sem tarefa S-xx, porque nenhuma tarefa do sprint cobre um
teste com quota real.

## Critérios de aceite

1. `grep -rnE "^\s*- \[ \]|^\s*- \[!\]" docs/specs` só retorna itens realmente abertos, cada um apontando para uma
   tarefa S-xx (exceção acima).
2. Nenhuma afirmação nova sem evidência.
3. Sem alteração de código.
