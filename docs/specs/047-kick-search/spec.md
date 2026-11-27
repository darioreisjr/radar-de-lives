# 047 — Buscar lives de GTA 6 na Kick e normalizar para `LiveItem`

Issue [#49](https://github.com/darioreisjr/radar-de-lives/issues/49) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 3 (Kick) · Branch `sprint/047-kick-search` · Spike: spec 020 · Cliente: spec 046

## Contexto

O cliente da Kick (spec 046) já obtém o token e faz chamadas validadas. O spike (spec 020) confirmou o contrato real de `GET /public/v2/livestreams` (a issue citava o v1, obsoleto) e mostrou:
- ~1700–1800 lives na categoria `13155`, em **2 páginas** de `limit=1000` (cursor em `pagination.next_cursor`);
- ordem da **mais antiga para a mais nova**, sem parâmetro de ordenação;
- `language_code` em BCP 47, com variantes (`en-IN`);
- `has_mature_content` em 98% da categoria (decisão D-K1: ignorar);
- miniaturas em `https://images.kick.com/` e `https://web.kick.com/`.

## Objetivo

Funções testadas que buscam as lives da categoria de GTA 6 e devolvem `LiveItem[]` válidos, com as mesmas regras de idioma e tamanho da lista da Twitch.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | Endpoint **v2** `GET /public/v2/livestreams?category_id=<KICK_CATEGORY_ID>&limit=1000`, seguindo `next_cursor` até **5 páginas**. | A premissa da issue ("uma página") foi refutada no spike (I2): a categoria tem ~1800 lives em 2 páginas, em ordem cronológica. Uma página só traria as mais antigas. |
| D2 | Falha na **1ª página** sobe o erro; falha numa página seguinte mantém as já obtidas, com `kick_error` (`stage: "page"`). | Mesmo comportamento da Twitch (spec 028 D5). |
| D3 | Cada item é validado com Zod **separadamente**; inválido é descartado e contado num `kick_error` (`code: "invalid_item"`, `count`). | CA4. |
| D4 | Idioma: prefixo de `language_code` (`pt`, `en`, `es`, inclusive `en-IN`); os demais ficam **fora da lista**. | PRD D7 (pt/en/es), como a Twitch faz pedindo só esses idiomas. O filtro `language_code` da API não foi confirmado no spike; filtramos no nosso código. |
| D5 | Sem duplicatas por `slug`; ordena por `viewer_count` decrescente (sem número por último) e fica com as **100 maiores**; `rank` = posição depois de ordenar. | Spec 020 I1; mesmo tamanho da lista da Twitch (spec 035). |
| D6 | `isMature` sempre `false`. | Decisão D-K1 do responsável (spec 020). |
| D7 | Miniatura só se for `https://images.kick.com/…` ou `https://web.kick.com/…`; senão `null`. | CA5; a CSP da #52 libera só esses domínios. |
| D8 | `sourceId` = `channel.slug` em minúsculas (validado `^[a-z0-9_-]{1,64}$`); `channelId` = `broadcaster_user.id` (texto), usado na revalidação (#51); `channelTitle` = `broadcaster_user.username`. | Spec 020 (I3 confirmada). |
| D9 | `watchUrl` = `https://kick.com/<slug>`; `embedUrl` = `https://player.kick.com/<slug>?autoplay=false&muted=true`. O player só entra em uso na #53. | Spec 020, mapeamento. A Kick não exige `parent`. |

## Mapeamento

| Kick (`LivestreamV2`) | `LiveItem` |
|---|---|
| `channel.slug` | `sourceId`, `id` = `kick:<slug>` |
| `title` | `title` (vazio → "Sem título") |
| — | `description` = `""` |
| `broadcaster_user.id` | `channelId` |
| `broadcaster_user.username` | `channelTitle` |
| `thumbnail` | `thumbnailUrl` (D7) |
| `started_at` | `liveStartedAt` e `publishedAt` |
| `viewer_count` | `concurrentViewers` (ausente ou inválido = `null`) |
| `language_code` | `language` (D4) |
| — | `isLive` = `true`, `embedAllowed` = `true`, `isMature` = `false` |

## Critérios de aceite

1. **CA1:** a fixture real do spike gera `LiveItem`s válidos, com `platform: "kick"` e `id` = `kick:<sourceId>`.
2. **CA2:** viewers ausentes viram `null`, nunca `0`.
3. **CA3:** idioma fora de pt/en/es fica de fora da lista (D4); `en-IN` entra como `en`.
4. **CA4:** um item com campo obrigatório faltando é descartado, e os demais seguem.
5. **CA5:** a URL da miniatura sempre usa HTTPS e um domínio esperado.
6. **CA6:** várias páginas pelo cursor, ordem por espectadores, corte nas 100 maiores, sem duplicatas, e falha parcial conforme D2.

## Fora do escopo

Cache, single-flight e registro no agregador (#50); status (#51); player (#53).

## Riscos e rollback

API recente: validação item a item. Rollback: reverter o PR (nada usa a busca ainda).
