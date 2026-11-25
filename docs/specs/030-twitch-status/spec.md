# 030 — Revalidar se uma live da Twitch continua no ar

Issue [#42](https://github.com/darioreisjr/radar-de-lives/issues/42) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 2 (Twitch) · Branch `sprint/030-twitch-status`

## Contexto

A skill SDD exige: "não assumir que uma live continua ativa depois da busca". O YouTube revalida em `/api/status/youtube/[id]` (spec 024). O diálogo já chama `/api/status/<platform>/<id>` para qualquer plataforma (spec 025), mas a Twitch ainda não oferece a revalidação, então a rota responde `400`.

## Objetivo

`GET /api/status/twitch/<login>` devolve `live` (com espectadores atualizados) ou `ended`, com cache curto.

## Fatos (spec 019)

- `GET /helix/streams?user_login=<login>` devolve a live do canal se ele estiver no ar; **lista vazia = offline**.
- Com `user_login`, a resposta traz todos os streams do canal, ignorando `first`.
- A Twitch não tem estado de live "agendada" equivalente ao do YouTube.

## Escopo

**Inclui**
- `lib/twitch/status.ts`:
  - validação do login;
  - consulta à Helix;
  - cache de 60 s (`status:twitch`);
  - single-flight por canal.
- Capacidade `status` no provedor da Twitch (`lib/lives/providers/twitch.ts`).
- Ligação no `server.ts`.

**Não inclui**
- O player (#44).

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | **Login válido:** `^[A-Za-z0-9_]{1,25}$`, comparado em minúsculas. Inválido → `400` sem chamar a Twitch (validação do handler, spec 024). | Formato de login da Twitch; mesmo padrão do id da busca (spec 028). |
| D2 | **Estados:** lista vazia → `ended`; live com `type: "live"` → `live` com `viewer_count`; `embedAllowed: true`. Não existe `upcoming` nem `unavailable` na Twitch. | Spec 019. |
| D3 | **Cache de 60 s** por canal, igual ao do YouTube; single-flight por canal. Falha do store → `upstream_unavailable` sem chamar a Twitch. | Spec 002 D5 e spec 005 D6. |
| D4 | **Sem orçamento diário:** o rate limit da rota (30 por minuto por cliente) e o cache de 60 s bastam diante dos 800 pontos por minuto. | Spec 029 D2. |
| D5 | **Erros do cliente** (`rate_limited`, `upstream_config`, `upstream_unavailable`) sobem e viram as respostas de sempre do handler. O diálogo trata erro como "não confirmado" (spec 002 D6). | Mesmo comportamento do YouTube. |

## Critérios de aceite

1. **CA1:** canal ao vivo → `state: "live"`, com `concurrentViewers` atualizado.
2. **CA2:** canal offline → `state: "ended"`, com `concurrentViewers: null`.
3. **CA3:** login inválido → `400 invalid_params`, sem chamar a Twitch.
4. **CA4:** duas consultas ao mesmo canal em menos de 60 s geram uma chamada; consultas simultâneas também.
5. **CA5:** com a Twitch ativa, `/api/status/twitch/<login>` responde pela rota real; sem ela, continua `400`.

## Riscos

- **Rollback:** reverter o PR. Sem a capacidade, a rota volta a responder `400` para a Twitch.
