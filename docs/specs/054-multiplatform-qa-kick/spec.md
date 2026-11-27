# 054 — QA manual com YouTube, Twitch e Kick

Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 4 (Encerramento) · Branch `sprint/054-multiplatform-qa-kick` · Repete a spec 042 (#56) com a Kick, como pede o plano ("rodar de novo o #56 depois da #55").

## Contexto

A Kick entrou em produção em 2026-11-27 (#55). O QA da spec 042 cobriu YouTube e Twitch. Com a terceira plataforma surgem combinações novas: três fontes em `sources`, filtro com três opções, intercalação `y t k`, player da Kick (sem aviso de login e sem tamanho mínimo) e lives da Kick sem selo adulto.

## Objetivo

Repetir o roteiro da spec 042 com as três plataformas e registrar o resultado de cada item em `tasks.md`. **Sem corrigir nada aqui**: cada falha vira uma issue ligada ao #28.

## Escopo

- **Estados:** misto com três plataformas; parcial com cada plataforma fora; duas fora; cache vencido; vazio.
- **Filtros:** "Plataforma" com YouTube, Twitch e Kick, combinado com idioma e ordenação.
- **Player da Kick:** live (consentimento sem aviso de login, iframe), encerrada, indisponível; em 360, 768 e 1280 px (sem tamanho mínimo); `Esc` e volta do foco, inclusive com live encerrada (spec 045).
- **Acessibilidade:** ordem do `Tab`, foco visível, regiões `aria-live`/`role="status"`, movimento reduzido.
- **Produção (só leitura):** três plataformas, filtro "Kick", player real da Kick, CSP, textos legais.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | Casos simulados no build local, com `/api/*`, miniaturas e players respondidos no navegador. | Mesmo método da spec 042 (D1). |
| D2 | Roteiro Playwright **temporário**, fora do commit. Só `docs/specs/054-*` muda. | Como na spec 042 (D2). |
| D3 | Tema claro e NVDA: como na spec 042 (não se aplica; item manual do responsável). | Sem mudança desde então. |

## Critérios de aceite

1. **CA1:** roteiro completo registrado em `tasks.md`, com o resultado de cada item.
2. **CA2:** cada falha virou uma issue com passos para reproduzir.
