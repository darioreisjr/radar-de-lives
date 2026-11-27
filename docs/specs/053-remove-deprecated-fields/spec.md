# 053 — Remover `videoId`, a rota `/api/lives/[videoId]` e `source`

Issue [#90](https://github.com/darioreisjr/radar-de-lives/issues/90) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 4 (Encerramento) · Branch `sprint/053-remove-deprecated-fields` · Decidido na #57 (spec 043 D1)

## Contexto

A Fase 1 manteve por compatibilidade:
- `videoId` em `LiveItem` e `LiveStatusPayload` (igual a `sourceId`; specs 021 D1 e 024 D3);
- a rota `GET /api/lives/[videoId]` (delega à de status; spec 024);
- `source` em `LivesPayload` (`"youtube" | "fixture"`), usado só para marcar os dados simulados de desenvolvimento.

O cliente já usa `id`, `sourceId`, `/api/status/[platform]/[id]` e `sources`.

## Objetivo

Remover os três itens sem quebrar o site nem o cache de produção.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | `videoId` sai de `LiveItem`, `LiveStatusPayload`, da normalização do YouTube e da Twitch, das fixtures e do mock do e2e. Dentro de `lib/youtube` (tipos crus, `VideoStatusPayload` interno, cache `status`), `videoId` continua: é o termo do YouTube, não do payload público. | Escopo: payload público. |
| D2 | **Cache em produção:** `withIdentity` passa a aceitar o formato gravado (`videoId` opcional) e **sempre devolve o item sem `videoId`**; para itens antigos, `sourceId` vem de `videoId`. O provedor da Twitch também passa os itens por `withIdentity`. | Itens já no Redis (com `videoId`, ou só com `videoId`) continuam válidos e saem limpos (lição da #63). |
| D3 | Revalidação: o provedor do YouTube monta o payload sem `videoId`; o serviço de status da Twitch para de gravar `videoId` e remove o campo de entradas antigas do cache (60 s). | Payload limpo desde o primeiro minuto. |
| D4 | `source` é trocado por `demo?: true`, presente **só** no payload simulado montado no cliente (`lives-provider.tsx`). O servidor nunca envia. | Mantém a marcação de simulados (CA3) sem campo inútil no payload real. |
| D5 | A rota `app/api/lives/[videoId]` é apagada; `GET /api/lives/<id>` passa a `404`. O handler de status perde a opção `idLabel`, que só ela usava. | Sem uso conhecido; a API é do próprio site. |
| D6 | O teste de caracterização mantém o snapshot **idêntico**: a coluna `videoId` da v1.0 passa a ser lida de `sourceId`. | Prova que nenhum valor mudou. |
| D7 | `dedupeByVideoId` (só usado em teste) sai; a deduplicação é por `id` (`dedupeById`). | Código morto. |

## Critérios de aceite

1. **CA1:** `videoId`, a rota antiga e `source` não existem mais no código público nem no payload de `/api/lives` e `/api/status`.
2. **CA2:** cache com itens no formato antigo (só `videoId`, sem `id`/`sourceId`) e no formato atual (com `videoId`) é servido corretamente e sem `videoId` (teste).
3. **CA3:** os dados simulados de desenvolvimento continuam marcados como simulados.
4. **CA4:** `GET /api/lives/<id>` responde `404` depois da remoção.
5. **CA5:** e2e verde nos dois perfis; snapshot de caracterização sem mudança.

## Riscos e rollback

- Clientes externos da rota antiga ou de `videoId` quebram (sem uso conhecido).
- **Rollback:** reverter o PR. O cache não muda de chave nem de formato gravado incompatível.
