# 024 — Rota de status por plataforma

Issue [#36](https://github.com/darioreisjr/radar-de-lives/issues/36) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 1 (Fundação) · Branch `sprint/024-status-route-by-platform`

## Contexto

Antes de abrir o player, o cliente revalida a live em `GET /api/lives/[videoId]` (spec 002), que valida o id com o regex do YouTube. Twitch e Kick precisam do mesmo (skill SDD: "não assumir que uma live continua ativa depois da busca").

**Limitação do Next:** `/api/lives/[platform]/[id]` não pode conviver com `/api/lives/[videoId]`, porque slugs dinâmicos com nomes diferentes no mesmo nível conflitam. Por isso a rota nova fica em outro caminho.

## Objetivo

Uma rota de status que funcione para qualquer plataforma ativa, sem quebrar a atual e sem mudar nada visível.

## Escopo

**Inclui**
- `GET /api/status/[platform]/[id]`.
- Capacidade opcional `status` no contrato `LivesProvider`: `isValidId(id)` e `getStatus(id)`.
- `LiveStatusPayload` = `VideoStatusPayload` + `platform` + `sourceId`.
- Handler compartilhado e testável (`lib/lives/status-handler.ts`), usado pelas duas rotas.
- `/api/lives/[videoId]` delega para o mesmo handler com a plataforma `youtube`. Fica marcada como obsoleta.
- Alias de `server-only` no Vitest, para os testes de rota.

**Não inclui**
- Remover a rota antiga (decisão na #57).
- O cliente usar a rota nova (#37).

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | A plataforma precisa estar **ativa** (selecionada por `LIVES_PROVIDERS`) e ter a capacidade `status`. Senão: `400 invalid_params`. | Não expor plataforma desligada. |
| D2 | Ordem igual à da rota atual: rate limit primeiro, depois validação, depois o provedor. | Mesmo comportamento. |
| D3 | As duas rotas devolvem `LiveStatusPayload`: os campos antigos com os mesmos valores, mais `platform` e `sourceId`. | Na Fase 1 só se acrescenta campo (plano, seção 5.2). |
| D4 | A rota antiga mantém a mensagem "Parâmetros inválidos: videoId inválido" e o rótulo de log `/api/lives/[videoId]`. | Zero mudança observável. |
| D5 | No YouTube, o status usa o `VideoStatusService` atual: cache de 60 s, orçamento de `videos.list` e single-flight sem mudança. | Mesma quota. |
| D6 | O Vitest troca `server-only` por um módulo vazio (`tests/stubs/server-only.ts`). | O pacote real lança erro fora do Next; o build continua usando o pacote real. |

## Critérios de aceite

1. **CA1:** `GET /api/status/youtube/<videoId>` devolve o mesmo conteúdo que `GET /api/lives/<videoId>`.
2. **CA2:** plataforma inexistente ou inativa → `400 invalid_params`, sem chamar provedor.
3. **CA3:** id inválido para a plataforma → `400 invalid_params`, sem chamar provedor.
4. **CA4:** rate limit (`429` com `Retry-After`) e `Cache-Control: no-store` iguais aos da rota atual.
5. **CA5:** a rota antiga continua passando nos testes e no e2e. Erros do provedor viram as mesmas respostas de hoje.

## Riscos

- **Rollback:** reverter o PR. O cliente ainda usa a rota antiga, e ela continua funcionando.
