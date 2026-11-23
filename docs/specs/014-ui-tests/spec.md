# 014 — Testes de interface com Playwright

Tarefa S-09 do [sprint.md](../../../sprint.md). Branch `sprint/014-ui-tests`.

## Contexto

Os estados da tela eram testados só como funções puras (`explorer-state`, `player-state`, `radar-stats`) e verificados à mão. Não havia teste automatizado no navegador. Decisão do usuário (2026-11-23): executar a S-09.

## Objetivo

Testes e2e contra `next build && next start`, **sem chave e sem quota**, cobrindo home, estados, player, teclado e movimento reduzido em desktop (1280 px) e celular (375 px).

## Escopo

Incluído: `@playwright/test` (devDependency), `playwright.config.ts`, `e2e/*`, script `test:e2e`, pastas de saída no `.gitignore`, esta spec.
Excluído: integração ao CI (ver "Integração futura ao CI"); alterações em `vitest.config.mts` e no código da aplicação.

## Requisitos

- **R1 Sem quota.** O servidor de teste roda com `YOUTUBE_API_KEY=""` (o `.env.local` não sobrescreve variáveis já definidas; conferido com `@next/env`). No navegador, toda rota de `/api/` é simulada; uma rota de `/api/` não simulada é abortada e falha o teste.
- **R2 Sem rede do Google.** Miniaturas (`i.ytimg.com`) e o player (`www.youtube.com`) respondem localmente. Qualquer requisição a `googleapis.com` falha o teste (`page.on("request")`).
- **R3 Cobertura.**
  1. Home com lives: total e idiomas no painel do radar, um único botão rosa visível, sem rolagem horizontal.
  2. Estados: `quota_exceeded` (503), `upstream_unavailable` (502) sem e com itens, `stale: true`, lista vazia, falha de rede.
  3. Player: revalidação `live` → consentimento → iframe `https://www.youtube.com/embed/<id>?playsinline=1&rel=0` sem `autoplay`; `ended`, `upcoming`, `unavailable` e `embedAllowed: false` sem iframe; falha da revalidação com aviso.
  4. Teclado: Tab chega aos filtros e a "Assistir aqui"; Esc fecha o diálogo e o foco volta ao botão.
  5. Movimento reduzido: `emulateMedia({ reducedMotion: "reduce" })` → animações com duração ≈ 0 e pulso sem repetição, com teste de controle sem a preferência.
  6. Extras: aceite da política (spec 016), filtros, "Carregar mais" e links obrigatórios em `/privacy`.

## Critérios de aceite

1. **CA1** `npm run test:e2e` passa localmente.
2. **CA2** Nenhuma requisição real a `googleapis.com` durante os testes.
3. **CA3** `npm test` (Vitest) continua com o mesmo número de testes (122).
4. **CA4** lint, typecheck e build verdes; o lockfile só ganha os pacotes do Playwright (regra 4 do sprint).

## Decisões

- **D1 Versão** `@playwright/test` **1.65.0** fixa (sem `^`). Era a mais nova com mais de duas semanas em 2026-11-23 (a 1.65.1 tinha 10 dias).
- **D2 Navegador:** só Chromium (`npx playwright install chromium`, ~123 MiB no cache do usuário, fora do repositório).
- **D3 Dois projetos:** `desktop` (1280×800) e `mobile-375` (375×812): todos os testes rodam nas duas larguras.
- **D4 Lockfile:** o `npm install` do npm 11 apagou as 17 bindings do rolldown, mesmo com `node_modules` limpo. Em vez de recriar o lockfile (o que poderia subir outras versões), o lock original recebeu só as 3 entradas novas (`@playwright/test`, `playwright`, `playwright-core`) e o bloco raiz. `npm ci` validou o resultado.

## Integração futura ao CI (fora desta tarefa)

Um job separado em `.github/workflows/ci.yml`, depois do job `verify`:

```yaml
  e2e:
    needs: verify
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@<sha> # mesma política de SHA da spec 009
      - uses: actions/setup-node@<sha>
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e   # CI=1: retries 1, reporter github, sem reutilizar servidor
```

Custo estimado: ~2 min por execução (instalação do navegador + build + 46 testes).
