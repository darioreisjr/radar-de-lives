# 028 — Buscar lives de GTA 6 na Twitch e normalizar para `LiveItem`

Issue [#40](https://github.com/darioreisjr/radar-de-lives/issues/40) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 2 (Twitch) · Branch `sprint/028-twitch-search`

## Contexto

O cliente HTTP com token de app existe (spec 027). Falta buscar as lives da categoria de GTA 6 e transformar cada uma no `LiveItem` neutro (spec 021), incluindo o selo de conteúdo adulto (PRD D6).

## Objetivo

Funções testadas que buscam as lives na Twitch e devolvem `LiveItem[]` válidos, com `platform: "twitch"`.

## Fatos (documentação oficial, consultada em 2026-11-25)

- **`GET /helix/streams`** (spec 019, F1):
  - `game_id`, `language` (repetível), `type=live`, `first` (máx. 100) e `after` (cursor);
  - **já vem ordenado por espectadores**;
  - uma página pode vir com menos que `first`, e pode haver **duplicatas entre páginas**;
  - `tags` pode ser `null`;
  - `tag_ids` e `is_mature` estão obsoletos (`is_mature` sempre `false`).
- **`GET /helix/channels`** ([referência](https://dev.twitch.tv/docs/api/reference/channels)):
  - aceita token de app;
  - `broadcaster_id` repetível, até 100;
  - `content_classification_labels: string[]`.
- **Rótulos possíveis** ([referência](https://dev.twitch.tv/docs/api/reference/ccls)): `DebatedSocialIssuesAndPolitics`, `DrugsIntoxication`, `Gambling`, `MatureGame`, `ProfanityVulgarity`, `SexualThemes` e `ViolentGraphic`.
- **`MatureGame` é automático:** "MatureGame, which you can't set". A Twitch o aplica pelo jogo, e o streamer não pode marcá-lo nem desmarcá-lo.

## Escopo

**Inclui**
- Schemas Zod dos campos usados (`lib/twitch/types.ts`).
- `searchTwitchLives(client, opts)` (`lib/twitch/search.ts`):
  - `language=pt,en,es` (D7 do PRD);
  - até 3 páginas;
  - deduplicação por `id`;
  - itens inválidos descartados e contados;
  - classificação de conteúdo adulto por `/helix/channels`.
- `normalizeStream()` (`lib/twitch/normalize.ts`) com o mapeamento da spec 019.
- Teste de contrato com a fixture real anonimizada (`tests/fixtures/twitch/streams.json`).

**Não inclui**
- Cache, orçamento e registro no agregador (#41).
- Revalidação de status (#42).
- Player (#44).

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | **Premissa, a confirmar com o responsável:** "Conteúdo adulto" = algum destes rótulos: `SexualThemes`, `DrugsIntoxication`, `ViolentGraphic`, `ProfanityVulgarity` ou `Gambling`. **Ficam de fora `MatureGame`** (automático para jogo adulto: marcaria praticamente toda live de GTA 6) e `DebatedSocialIssuesAndPolitics` (política, não conteúdo adulto). A lista fica numa constante. | Um selo em todos os cards não informa nada. |
| D2 | Até **3 páginas** de 100 (spec 019 I2), parando antes se não houver cursor ou a página vier vazia. | Mais de 100 lives em pt ao mesmo tempo (spec 019). |
| D3 | Ordem = ordem da API (por espectadores); `rank` = posição depois do dedupe. | A Twitch já ordena; o agregador intercala (spec 022 D3). |
| D4 | **Falha em `/helix/channels`:** a lista continua com `isMature: false` e um log `twitch_error` (`stage: "channels"`). | O selo é secundário; não pode derrubar a busca. |
| D5 | **Falha em `/helix/streams`:** o erro do cliente sobe (`LivesError`). Se uma página seguinte falhar, ficam as páginas já obtidas, com log. | A #41 decide sobre o cache vencido. |
| D6 | **Validação item a item:** cada stream passa pelo schema separadamente, para que um item inválido não descarte a página toda. | Um item ruim não derruba a lista (CA4). |
| D7 | **Campos:** idioma direto do campo `language` (pt, en ou es; o resto vira `unknown`); miniatura `640x360`, só em `https://static-cdn.jtvnw.net/`; `embedUrl` vazio (a URL do player é montada no cliente com `parent`, spec 025). | Spec 019 e Developer Agreement (cache curto, player oficial). |

## Critérios de aceite

1. **CA1:** a fixture real gera `LiveItem`s válidos, com `platform: "twitch"` e `id` = `twitch:<user_login>`.
2. **CA2:** espectadores ausentes ou inválidos viram `null`, nunca `0`.
3. **CA3:** idioma fora de pt, en e es vira `unknown`.
4. **CA4:** item sem campo obrigatório é descartado, e os demais seguem; o descarte é contado no log.
5. **CA5:** a miniatura sempre usa HTTPS e o domínio `static-cdn.jtvnw.net`; senão, `null`.
6. **CA6:** busca com 3 páginas, duplicatas entre páginas e parada sem cursor; `/helix/channels` em lotes de até 100; os rótulos D1 marcam `isMature`, e `MatureGame` sozinho não marca.
7. **CA7:** falha em `/helix/channels` mantém a lista (D4); falha na 1ª página de streams lança o erro (D5).

## Riscos

- **A premissa D1 não agradar.** É uma constante e um teste, fácil de mudar.
- **Rollback:** reverter o PR. O código ainda não está ligado ao agregador.
