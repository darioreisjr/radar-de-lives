# 009 — CI no GitHub Actions

Status: em andamento · Data: 2026-11-22
Fonte: [sprint.md — S-04](../../../sprint.md#s-04--ci-no-github-actions).

## 1. Contexto

A Vercel só roda `next build`. Lint, typecheck e os testes Vitest não rodam em nenhum push. O repositório é público, então o GitHub Actions é gratuito.

## 2. Objetivo

Um workflow que, em todo push e PR para `main`, roda `npm ci`, `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`, e falha se qualquer etapa falhar.

## 3. Fatos confirmados (2026-11-22)

| Item | Fato |
| --- | --- |
| `actions/checkout` | Última versão `v7.0.1`, commit `3d3c42e5aac5ba805825da76410c181273ba90b1` (`gh api repos/actions/checkout/releases/latest`) |
| `actions/setup-node` | Última versão `v7.1.0`, commit `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| Node exigido | Vitest 5: `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0`; `package.json` não declara `engines` |
| Lockfile | Contém as bindings do rolldown para todas as plataformas (17 entradas), então `npm ci` instala a binding de Linux |
| `scripts/test.mjs` | Só normaliza a letra do drive no Windows; no Linux chama o Vitest direto |
| Build sem segredos | Sem `YOUTUBE_API_KEY` o build passa; a API responde "não configurada" só em tempo de execução |

## 4. Decisões

- **D1 — Gatilhos:** `push` em qualquer branch e `pull_request` para `main`. Assim o CI roda nas branches `sprint/*` antes do PR (exigido pelo critério 1 da S-04) e no PR.
- **D2 — Actions fixadas por SHA**, com a versão em comentário (`# v7.0.1`). Num repositório público, isso impede que uma tag movida troque o código executado. Para atualizar, rode de novo os comandos do §3.
- **D3 — Node 22** (`node-version: 22`), a mesma versão maior do ambiente local (22.23), com `cache: npm`.
- **D4 — Permissões mínimas:** `permissions: contents: read`.
- **D5 — `concurrency`** por workflow e ref, cancelando execuções antigas da mesma branch.
- **D6 — `timeout-minutes: 15`** e `NEXT_TELEMETRY_DISABLED=1`.
- **D7 — Sem segredos** no workflow e no repositório.
- **D8 — Um único job sequencial:** o projeto é pequeno (a suíte inteira leva menos de 1 minuto), então paralelizar só somaria tempo de instalação.

## 5. Critérios de aceite

1. **CA1** O workflow roda num push para `sprint/009-ci` e fica verde.
2. **CA2** Um teste quebrado de propósito, numa branch descartável e sem merge, faz o CI falhar. Resultado registrado e branch apagada.
3. **CA3** Nenhum segredo no workflow.
4. **CA4** Localmente, com o mesmo `package-lock.json`, `npm ci` e as quatro verificações passam.

## 6. Fora do escopo

- Testes e2e (S-09).
- Proteção de branch exigindo o CI (configuração do repositório, decisão do usuário).
- Badge no README (só a S-06 altera o README).
