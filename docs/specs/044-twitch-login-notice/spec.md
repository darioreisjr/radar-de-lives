# 044 — Avisar que a Twitch pode pedir login antes de carregar o player

Issue [#86](https://github.com/darioreisjr/radar-de-lives/issues/86) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Falha B2 do QA (spec 042) · Branch `sprint/044-twitch-login-notice`

## Contexto

No QA da spec 042, o player embutido da Twitch mostrou, em 5 de 5 canais, a tela "O conteúdo de <canal> é destinado a públicos específicos. Pode conter: Jogo apenas para adultos. Você deve entrar ou criar uma conta para continuar." GTA 6 tem o rótulo `MatureGame` na Twitch, e o player embutido exige conta logada para esse rótulo. Quem não está logado (ou bloqueia cookies de terceiros) não assiste no site, e nada avisa antes.

## Objetivo

**Decisão do responsável (opção 2):** manter o player e avisar, antes de "Carregar player", que a Twitch pode pedir login, indicando "Abrir na Twitch" como saída.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | Novo campo opcional `loginNotice` no mapa de plataformas (`lib/lives/platforms.ts`), só na Twitch: `{ beforeLoad, withPlayer }`. | Textos por plataforma no mapa (spec 025 D1); o YouTube não tem o campo e não muda. |
| D2 | `beforeLoad` aparece no consentimento, **depois** do texto de privacidade e **antes** do botão "Carregar player", como parágrafo no fluxo do diálogo (lido por leitor de tela; a área já é `aria-live="polite"`). | Quem decide carregar já sabe do login. |
| D3 | Com o player carregado, o rodapé usa `withPlayer` ("Se a Twitch pedir login ou o player não carregar, abra na Twitch.") em vez do texto genérico. O caso "não confirmamos o estado" continua igual. | Saída visível quando o bloqueio aparece dentro do iframe. |
| D4 | O aviso não aparece nos estados sem player (`ended`, `unavailable`, tela estreita, só-link). | Lá o link já é a ação principal. |
| D5 | A regra do selo "Conteúdo adulto" (PRD D6) não muda. | Fora do escopo da issue. |

## Textos

- **beforeLoad:** "A Twitch classifica GTA 6 como jogo para adultos e pode pedir que você entre na sua conta para assistir. Se pedir, use “Abrir na Twitch”."
- **withPlayer:** "Se a Twitch pedir login ou o player não carregar, abra na Twitch."

## Critérios de aceite

1. **CA1:** numa live da Twitch, o aviso de login aparece antes do "Carregar player".
2. **CA2:** o player do YouTube não muda (textos e e2e atuais).
3. **CA3:** o aviso é texto no fluxo do diálogo, acessível a leitor de tela.
4. **CA4:** com o player da Twitch carregado, o rodapé cita o login.
5. **CA5:** e2e cobrindo o aviso na Twitch e a ausência dele no YouTube.

## Riscos e rollback

Só texto na interface. Rollback: reverter o PR.
