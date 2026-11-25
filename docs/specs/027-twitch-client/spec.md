# 027 — Credenciais da Twitch e cliente HTTP com token de app

Issue [#39](https://github.com/darioreisjr/radar-de-lives/issues/39) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 2 (Twitch) · Branch `sprint/027-twitch-client`

## Contexto

Toda chamada à API Helix exige um token de app, obtido por *client credentials* (spec 019, F2). As credenciais são segredo e seguem a regra da `YOUTUBE_API_KEY`: só no servidor e nunca em log (PRD §12.5; Developer Agreement IV.B).

## Objetivo

Um cliente HTTP da Twitch que obtém, guarda, valida e renova o token sozinho, e expõe uma chamada autenticada à Helix, validada com Zod, para as issues #40 a #42.

## Escopo

**Inclui**
- `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` e `TWITCH_GAME_ID` (padrão `1867279146`, spec 019) em `server-env.ts`.
- `lib/twitch/client.ts` (`server-only`):
  - token em memória por instância;
  - single-flight na obtenção;
  - renovação antes de vencer;
  - validação a cada hora;
  - `helix(path, params, schema)` com timeout, nova tentativa, mapeamento de erros e leitura dos cabeçalhos `Ratelimit-*`.
- Telemetria `twitch_token` e `twitch_error`, sem token, secret ou URL.
- Passo de CI que procura credenciais e o endpoint de token no bundle do cliente (plano, seção 5.5).
- `.env.example`.

**Não inclui**
- Busca de lives (#40).
- Serviço, cache e registro no agregador (#41).

## Fatos usados (spec 019)

- **Token:** `POST https://id.twitch.tv/oauth2/token`, form-urlencoded, `grant_type=client_credentials`. A resposta tem `access_token`, `expires_in` (segundos) e `token_type`; não há refresh token.
- **Validação:** `GET https://id.twitch.tv/oauth2/validate` com `Authorization: OAuth <token>`. Apps que mantêm sessão OAuth "must call /validate".
- **Helix:** cabeçalhos `Client-Id` e `Authorization: Bearer <token>`.
- **Erros:** `401` = token inválido; `429` = esperar até `Ratelimit-Reset` (epoch em segundos); `503` = tentar de novo uma vez.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | Token **só em memória** por instância; não vai para o Upstash. | Pedir token é barato; fora do store, a superfície de vazamento é menor. |
| D2 | Renovar 5 min antes de vencer. Validar a cada 1 h: `401` descarta o token; outras falhas não bloqueiam. | Developer Agreement e F2. |
| D3 | **Mapeamento de erros:** rede, timeout e `5xx` → 1 nova tentativa e depois `upstream_unavailable`; `401` → token novo e 1 nova tentativa, e um segundo `401` → `upstream_config`; `429` → `rate_limited` com `retryAfterSeconds`; `400`, `403` e `404` → `upstream_config`; resposta fora do schema → `upstream_unavailable`. | Mesmo vocabulário de erros do YouTube (`LivesErrorCode`). |
| D4 | Erro no endpoint de token: `400`, `401` e `403` → `upstream_config` (credencial inválida); rede e `5xx` → `upstream_unavailable`. | — |
| D5 | **Logs:** só `stage` (`token`, `validate`, `helix`), `status` HTTP e `code`. Nunca URL, cabeçalhos, corpo, token ou secret. | `CLAUDE.md` e PRD §12.5. |
| D6 | `createTwitchClientFromEnv(env)` devolve `null` sem `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET`; `isTwitchConfigured(env)` diz o mesmo. Sem cliente, nenhuma chamada de rede. | A #41 usa isso em `isConfigured()` (spec 023 R4). |

## Critérios de aceite

1. **CA1:** sem credenciais, `isTwitchConfigured` é `false`, o cliente é `null` e nenhuma chamada de rede acontece.
2. **CA2:** chamadas simultâneas sem token geram **um** pedido de token.
3. **CA3:** um `401` dispara um token novo e uma nova tentativa; um segundo `401` vira `upstream_config`.
4. **CA4:** o token é renovado antes de vencer, e a validação roda a cada hora (teste com relógio falso).
5. **CA5:** nenhum `logEvent` contém o secret, o token ou URL com query (teste).
6. **CA6:** `lib/twitch/client.ts` importa `server-only`, e o CI falha se o endpoint de token ou o nome do secret aparecer em `.next/static`.

## Riscos

- **Rollback:** reverter o PR. O cliente ainda não é usado por nenhum provedor ativo.
