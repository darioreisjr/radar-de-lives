# 035 — Limitar a busca da Twitch a 1 página por padrão

Issue [#78](https://github.com/darioreisjr/radar-de-lives/issues/78) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 2 (Twitch) · Branch `sprint/035-twitch-max-pages`

## Contexto

Na ativação (#47), a busca da Twitch trouxe ~300 lives (3 páginas de 100), contra 50 do YouTube. Com a intercalação por posição (PRD D5), da 51ª posição em diante só sobravam lives da Twitch: ~85% da lista.

## Objetivo

Buscar só a **1ª página** (até 100 lives, as de maior público; a Helix ordena por espectadores) por padrão, com o limite configurável sem mudar o código.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | Variável `TWITCH_MAX_PAGES`, padrão **1**, faixa **1–3**. | O teto de 3 páginas da spec 028 (D2) continua valendo. |
| D2 | Fora da faixa, o valor é **cortado** (`0` → 1, `4` → 3); texto inválido volta ao padrão. Sem `config_warning`. | Mesma regra do helper `int()` das outras variáveis numéricas (TTLs, orçamentos). A issue sugeria aviso no log; ficou a consistência com o resto da configuração. |
| D3 | O padrão de `searchTwitchLives` também passa a ser 1 (`TWITCH_DEFAULT_MAX_PAGES`). | Um só padrão no código; os testes de várias páginas passam `maxPages: 3`. |
| D4 | `twitchMaxPages` entra na assinatura do runtime. | Mudar a variável recria o runtime, como as demais da Twitch. |
| D5 | O cache em `lives:twitch` não muda de chave. | Depois do deploy, a lista antiga (~300) some no próximo refresh (TTL 180 s + stale 600 s). |

## Critérios de aceite

1. **CA1:** sem a variável, a busca faz 1 chamada a `/helix/streams` e devolve no máximo 100 lives.
2. **CA2:** com `TWITCH_MAX_PAGES=3`, o comportamento é o de antes: até 3 páginas, sem duplicatas, e uma falha numa página seguinte mantém as já obtidas.
3. **CA3:** valores fora da faixa são cortados, e texto inválido volta ao padrão (D2).
4. **CA4:** a saída do YouTube não muda (teste de caracterização).
5. **CA5:** em produção, `/api/lives` mostra no máximo 100 lives da Twitch, com a lista ainda intercalada.

## Efeitos

- Lista com até ~150 lives (50 do YouTube + até 100 da Twitch).
- Por atualização do cache: 1 chamada a `/streams` + 1 a `/channels`, contra até 3 + 3 antes.
- Lives com menos público na Twitch deixam de aparecer, o que o PRD D9 aceita ("Lives encontradas", nunca "todas").

## Riscos e rollback

- Risco baixo: só reduz o volume.
- **Rollback:** `TWITCH_MAX_PAGES=3` na Vercel + redeploy, ou reverter o PR.
