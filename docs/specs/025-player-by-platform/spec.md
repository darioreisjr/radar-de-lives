# 025 — Player e revalidação conforme a plataforma da live

Issue [#37](https://github.com/darioreisjr/radar-de-lives/issues/37) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 1 (Fundação) · Branch `sprint/025-player-by-platform`

## Contexto

No diálogo do player, tudo assume YouTube:
- a URL do iframe (`embedSrc(videoId)`);
- a revalidação (`/api/lives/[videoId]`);
- os textos "Abrir no YouTube" e "O YouTube informa…";
- o aviso de consentimento do Google;
- o botão "YouTube" do card.

A rota `/api/status/[platform]/[id]` já existe (spec 024).

## Objetivo

O diálogo e o card escolhem URL, rota de status e textos pela `platform` do item. Plataformas sem player embutido abrem um modo só com o link. **Para o YouTube, nada muda**: mesmos textos, mesma URL do iframe e mesmo comportamento.

## Escopo

**Inclui**
- `lib/lives/platforms.ts`: mapa por plataforma com:
  - rótulos já flexionados ("no YouTube", "do YouTube", "O YouTube");
  - se aceita embed;
  - URL do iframe;
  - texto e link de privacidade do consentimento.
- `embedSrc(item, { hostname })`: o `hostname` já entra na assinatura porque a Twitch exige `parent` (#44).
- `resolvePlayerView` com `platformEmbed`: `false` → novo estado `link_only`.
- O diálogo usa `/api/status/<platform>/<sourceId>`.
- A revalidação no cliente (`item-status`) casa por `platform` e `sourceId` (`LiveStatusPayload`).
- Textos do diálogo e do card vêm do mapa.

**Não inclui**
- Players da Twitch e da Kick (#44 e #53). Nesta fatia elas ficam `embed: false`, ou seja, só link.
- Mudança visual no YouTube.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | Formas flexionadas prontas no mapa (`inLabel`, `ofLabel`, `subjectLabel`). | Português tem gênero ("no YouTube" × "na Twitch"); montar por regra gera erro. |
| D2 | O consentimento usa o texto e o link de privacidade do mapa. Só o YouTube tem esses dados agora; as outras plataformas ganham os seus quando o embed for ligado (#44, #53). | Não publicar texto de privacidade não verificado. |
| D3 | O modo `link_only` ignora o resultado da revalidação para decidir a tela, mas a revalidação continua rodando (atualiza o card). | O estado da live segue útil mesmo sem player. |
| D4 | `hostname` vem de `window.location.hostname` no diálogo, que só renderiza no cliente, depois do clique. | Funciona em produção, Preview e `localhost` (spec 019 I3). |

## Critérios de aceite

1. **CA1:** no YouTube, a URL do iframe é idêntica à de hoje (teste unitário e e2e).
2. **CA2:** o diálogo chama `/api/status/youtube/<id>` (e2e com a rota simulada).
3. **CA3:** uma plataforma com `embed: false` abre o modo só-link, sem iframe nem consentimento, com o link "Abrir na <plataforma>" acessível por teclado (unitário e e2e).
4. **CA4:** nenhuma violação de CSP no e2e, e os textos do YouTube no diálogo e no card continuam iguais (os e2e existentes passam sem mudar asserções de texto).

## Riscos

- **Rollback:** reverter o PR. A rota antiga de status continua no ar.
