# 036 — Separar o Redis do Preview das chaves da produção

Issue [#81](https://github.com/darioreisjr/radar-de-lives/issues/81) · Encontrada depois da spec 035 (#78) · Fase 2 (Twitch) · Branch `sprint/036-preview-store-isolation`

## Contexto

Em 2026-11-25, depois do deploy da spec 035, a produção voltou a mostrar 293 lives da Twitch, em vez de até 100. Os logs da Vercel mostraram a causa:

| Hora (UTC) | Ambiente | Deploy | Evento |
|---|---|---|---|
| 19:57:04 | Production | código da 035 | `twitch_call` com 99 itens |
| 20:04:08 | **Preview** (`git-sprint-033-twitch-legal`, código anterior à 035) | antigo | `twitch_call` com **293** itens |

- **Mesmo Redis.** As variáveis do Upstash (`KV_REST_API_*`) valem para Preview e Production. O Preview grava `lives:twitch` na mesma chave, e a produção serve esse valor até o próximo refresh.
- **YouTube zerado no print.** A tela com "YouTube 0" era desse Preview. Lá não existe `YOUTUBE_API_KEY` (só em Production, por decisão de segurança), então o Preview só tem a Twitch. Na produção, `/api/lives` tinha 50 lives do YouTube o tempo todo.

## Objetivo

Preview e Development não leem nem gravam as chaves da produção: cache, contadores (rate limit e orçamentos de cota) e travas.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | Prefixo por `VERCEL_ENV`: `production` ou ausente → nenhum; `preview` → `preview:`; `development` → `development:`; valor estranho → `preview:`. | Production mantém **exatamente** as chaves de hoje (lição do incidente da #63). |
| D2 | O prefixo é aplicado no adaptador do Redis (`withKeyPrefix`), abaixo de cache, contador e trava. | Um ponto só, e nenhuma chave fica de fora. |
| D3 | Sem prefixo, `withKeyPrefix` devolve o mesmo cliente. | Produção sem nenhuma mudança de comportamento. |
| D4 | Sem variável nova; `VERCEL_ENV` é definida pela própria Vercel. | Nada a configurar no painel. |

## Limite conhecido

Os **deploys de Preview antigos** (anteriores a esta spec) continuam com o código antigo e ainda gravam nas chaves da produção quando alguém os abre. Eles ficam atrás do login da Vercel, então só o dono do projeto os acessa. Recomendação: não abrir Previews antigos ou removê-los no painel. Uma contaminação some sozinha no próximo refresh da produção (cache da Twitch de 180 s).

## Critérios de aceite

1. **CA1:** com `VERCEL_ENV=production` ou sem a variável, as chaves são as de antes (teste).
2. **CA2:** no Preview, cache, contador e trava usam chaves com `preview:` e não alteram as da produção (teste com Redis falso).
3. **CA3:** a saída do YouTube não muda (caracterização).
4. **CA4:** depois do deploy, abrir o Preview novo não altera `/api/lives` da produção (até 100 lives da Twitch).

## Rollback

Reverter o PR. O Preview volta a compartilhar as chaves; a produção não muda.
