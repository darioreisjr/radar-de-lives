# 042 — QA manual com várias plataformas

Issue [#56](https://github.com/darioreisjr/radar-de-lives/issues/56) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 4 (Encerramento) · Branch `sprint/042-multiplatform-qa`

## Contexto

A spec 015 fez o QA manual quando só havia o YouTube. Com a Twitch ativa em produção (#47), surgem combinações novas: resultado parcial, filtro por plataforma, selos, conteúdo adulto e um segundo player.

## Objetivo

Repetir o roteiro da spec 015 com YouTube e Twitch e registrar o resultado de cada item em `tasks.md`. **Sem corrigir nada aqui**: cada falha vira uma issue ligada ao #28.

## Escopo

- **Estados:** carregando, vazio, erro total, resultado parcial (cada plataforma fora), cache vencido (`stale`).
- **Filtros:** plataforma combinada com idioma e ordenação; combinação sem resultado.
- **Player da Twitch:** live, live encerrada, indisponível, tela pequena, `Esc` e volta do foco.
- **Conteúdo adulto:** selo "Conteúdo adulto".
- **Acessibilidade:** teclado, foco visível, anúncios para leitor de tela (`role="status"` e `aria-live`), `prefers-reduced-motion`.
- **Exibição:** 360 px, tablet (768 px) e desktop (1280 px), sem rolagem horizontal.
- **Produção:** smoke com dados reais: lista com as duas plataformas, filtro, selo adulto e player real da Twitch.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | Casos simulados rodam num build local com `LIVES_PROVIDERS=youtube,twitch` e credenciais falsas, com `/api/*`, miniaturas e players simulados no navegador (mesmos mocks do e2e). | Reproduz cada estado sem depender da API real nem gastar quota (como a spec 015). |
| D2 | O roteiro é um script Playwright **temporário**, fora do commit. Só `docs/specs/042-*` muda. | Escopo da issue. |
| D3 | **Tema claro: não se aplica.** O site só tem tema escuro (`colorScheme: "dark"` em `app/layout.tsx`). | Registrado para não parecer esquecido. |
| D4 | **Leitor de tela:** o agente não roda NVDA. Verifica a árvore de acessibilidade (papéis, nomes e regiões `aria-live`) pelo Playwright. O teste com NVDA fica como item manual para o responsável. | Limite do ambiente. |
| D5 | Em produção, só leitura: nenhuma mudança de variável ou deploy. | Sem risco. |

## Critérios de aceite

1. **CA1:** roteiro completo registrado em `tasks.md`, com o resultado de cada item.
2. **CA2:** cada falha virou uma issue com passos para reproduzir.

## Riscos e rollback

Sem alteração de código. Rollback não se aplica.
