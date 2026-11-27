# 050 — CSP: miniaturas e player da Kick

Issue [#52](https://github.com/darioreisjr/radar-de-lives/issues/52) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 3 (Kick) · Branch `sprint/050-kick-csp` · Specs: 017 (CSP), 020 (spike), 031 (CSP da Twitch), 047 (busca)

## Contexto

A CSP de `next.config.ts` libera só as origens do YouTube e da Twitch. A busca da Kick (spec 047) aceita miniaturas só de `https://images.kick.com/` e `https://web.kick.com/` (as duas vistas no spike, P2), e o player embutido da Kick (#53, PRD D3) é `https://player.kick.com/<slug>`, que no P3 carregou e tocou num iframe sem pedir login.

## Objetivo

A CSP permite **só** essas três origens da Kick, sem curinga, e nada muda para YouTube e Twitch.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | `img-src` + `https://images.kick.com https://web.kick.com`. | Os dois CDNs de miniatura do spike; a normalização (047 D7) descarta qualquer outro. `files.kick.com` (foto de perfil e capa da categoria) **não** entra: o card não usa essas imagens. |
| D2 | `frame-src` + `https://player.kick.com`. | Player oficial (PRD D3; spec 020 P3). |
| D3 | `connect-src` continua `'self'`. | A API e o token da Kick são chamados no servidor (specs 046 a 049). |
| D4 | O e2e novo responde as origens da Kick **dentro do próprio teste** (`page.route`), sem mexer em `e2e/support.ts`. | `support.ts` não está na lista de arquivos da issue; nada sai para a Kick no CI. |
| D5 | O iframe da Kick só é exercitado no e2e da #53, quando o player da Kick for ligado no mapa de plataformas. Aqui, o teste unitário confere a origem no `frame-src`. | Hoje a Kick é "só link" (`embed: false`). |

## Critérios de aceite

1. **CA1:** `tests/security-headers.test.ts` confere as origens novas, listas exatas e nenhum curinga.
2. **CA2:** o e2e com miniaturas da Kick (nos dois CDNs) roda sem violação de CSP.
3. **CA3:** as origens do YouTube e da Twitch continuam iguais.

## Riscos e rollback

Rollback: reverter o PR. Sem as origens, as miniaturas da Kick ficariam em branco (e o e2e falha).
