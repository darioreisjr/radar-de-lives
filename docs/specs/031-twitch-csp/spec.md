# 031 — CSP: miniaturas e player da Twitch

Issue [#43](https://github.com/darioreisjr/radar-de-lives/issues/43) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 2 (Twitch) · Branch `sprint/031-twitch-csp`

## Contexto

A CSP aplicada em `next.config.ts` (spec 017) libera só `https://i.ytimg.com` em `img-src` e `https://www.youtube.com` em `frame-src`. Sem ajuste, o navegador bloqueia as miniaturas e o player da Twitch, e o e2e falha em qualquer violação.

## Objetivo

A CSP libera **só** as duas origens exatas da Twitch, sem curingas.

## Fatos (spec 019)

- **Miniaturas:** `https://static-cdn.jtvnw.net/previews-ttv/...` (resposta real) e capas em `.../ttv-boxart/...`.
- **Player:** `https://player.twitch.tv/?channel=<login>&parent=<domínio>` (doc oficial de embed). A decisão D3 do PRD é usar player embutido.

## Escopo

**Inclui**
- `img-src` + `https://static-cdn.jtvnw.net`.
- `frame-src` + `https://player.twitch.tv`.
- Comentário da CSP atualizado.
- Testes da CSP: origens exatas, sem curingas, YouTube sem mudança.
- e2e: miniaturas e player da Twitch respondidos localmente (nada sai para a Twitch nos testes); card da Twitch com miniatura sem violação de CSP.

**Não inclui**
- O player da Twitch em si (#44); o teste do iframe sem violação de CSP fica para a #44.
- Origens da Kick (#52).

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | Origens exatas (`https://static-cdn.jtvnw.net`, `https://player.twitch.tv`), sem `*.twitch.tv`, `*.jtvnw.net` ou `https:`. | Liberar só o necessário. |
| D2 | `connect-src` continua `'self'`: o navegador só fala com a nossa API; as chamadas à Twitch são do servidor. | Credenciais só no servidor (spec 027). |
| D3 | O e2e bloqueia qualquer requisição real à Twitch e responde localmente, como já faz com o YouTube. | Testes sem rede externa. |

## Critérios de aceite

1. **CA1:** `tests/security-headers.test.ts` confere as origens novas e confere que não há curingas.
2. **CA2:** o e2e com miniatura da Twitch (fixture) roda sem violação de CSP e sem requisição real à Twitch.
3. **CA3:** as origens do YouTube continuam iguais.

## Riscos

- **Rollback:** reverter o PR. Liberar uma origem não quebra nada para o YouTube.
