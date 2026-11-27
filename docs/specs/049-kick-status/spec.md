# 049 — Revalidar se uma live da Kick continua no ar

Issue [#51](https://github.com/darioreisjr/radar-de-lives/issues/51) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 3 (Kick) · Branch `sprint/049-kick-status` · Specs: 020, 046, 048

## Contexto

A skill SDD diz: "não assumir que uma live continua ativa depois da busca". YouTube e Twitch revalidam em `/api/status/<plataforma>/<id>` antes de abrir o player. O player já chama `/api/status/kick/<sourceId>`, e o `sourceId` da Kick é o **slug** do canal (spec 047). Hoje a rota responde `400` para a Kick (spec 048 D5).

O spike registrou só `GET /public/v1/users/livestreams?user_id=…`, que pede o id numérico. A especificação OpenAPI oficial (`api.kick.com/swagger/doc.yaml`, lida em 2026-11-27) tem também, literal:
- `GET /public/v1/channels`: "Retrieve channel information based on provided broadcaster user IDs or channel slugs"; `slug` em array, "up to 50, each max 25 characters"; aceita `AppAccessToken`; respostas `200`, `400`, `401`, `403`, `500`.
- Resposta: `data[]` de `GetChannel` com `slug`, `broadcaster_user_id`, `stream_title` e `stream` (`is_live`, `viewer_count`, `start_time`, `thumbnail`, **`key`** e **`url`**, que são a chave e o endereço de transmissão do streamer).

## Objetivo

`GET /api/status/kick/<slug>` devolve `live` (com espectadores atualizados) ou `ended`, com cache curto.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | Usar `GET /public/v1/channels?slug=<slug>` (uma chamada, pelo slug). | O player já envia o slug; não precisa descobrir o id numérico. `/users/livestreams` exigiria o `broadcaster_user_id`. |
| D2 | O schema Zod lê **só** `slug`, `stream.is_live` e `stream.viewer_count`; os demais campos são descartados. `stream.key` e `stream.url` nunca são guardados, devolvidos nem registrados. | Segredo do streamer presente na resposta (D2 é obrigatório). |
| D3 | Mapeamento: canal com `stream.is_live === true` → `live`, com `viewer_count`; canal sem `stream` ou com `is_live` falso → `ended`; **lista vazia** (slug não encontrado) → `unavailable`. | A Kick não tem "agendada". A especificação não diz se `stream` vem quando o canal está offline, nem o que um slug inexistente devolve: o mapeamento cobre todos os casos sem supor. |
| D4 | Validação do id: `^[A-Za-z0-9_-]{1,25}$` (limite da especificação), comparado em minúsculas; inválido → `400 invalid_params` sem chamar a Kick (handler da spec 024). | CA3. |
| D5 | Cache de **60 s** por canal em `status:kick` e single-flight por canal; store fora → fecha sem chamar a Kick. `embedAllowed: true`. | Mesmo valor e desenho do YouTube e da Twitch (spec 030). |
| D6 | Erros do cliente (`rate_limited`, `upstream_config`, `upstream_unavailable`) sobem e o handler devolve as respostas de sempre. | Spec 024. |
| D7 | `lib/lives/server.ts` cria o serviço de status com o cliente da Kick e o cache `status:kick`. | Ligação necessária; **arquivo fora da lista da issue, a confirmar com o responsável.** |

## Critérios de aceite

1. **CA1:** canal ao vivo → `state: "live"`, com `concurrentViewers` atualizado.
2. **CA2:** canal offline → `state: "ended"`.
3. **CA3:** nome de canal inválido → `400 invalid_params`, sem chamar a Kick.
4. **CA4:** duas consultas ao mesmo canal em menos de 60 s geram uma chamada.
5. **CA5:** a resposta nunca contém `key` nem `url` do stream.

## Pendência

Confirmar com dados reais (no Preview da #55) como a Kick responde para canal offline e para slug inexistente. O mapeamento D3 já trata os dois formatos possíveis.

## Riscos e rollback

A rota só aceita a Kick se ela estiver ativa em `LIVES_PROVIDERS`. Rollback: reverter o PR.
