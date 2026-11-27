# 046 — Credenciais da Kick e cliente HTTP com token de app

Issue [#48](https://github.com/darioreisjr/radar-de-lives/issues/48) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 3 (Kick) · Branch `sprint/046-kick-client` · Spike: spec 020 (#31)

## Contexto

Toda chamada à API pública da Kick precisa de um token de app (*client credentials*). O spike (spec 020) confirmou, em 2026-11-27:
- token em `POST https://id.kick.com/oauth/token`, corpo `application/x-www-form-urlencoded` com `grant_type=client_credentials`, `client_id` e `client_secret`;
- resposta com `access_token`, `token_type` e `expires_in` (**5184000 s = 60 dias**); sem refresh token;
- API em `https://api.kick.com/public/...`, com `Authorization: Bearer <token>`; funciona a partir da Vercel (`iad1`, P3);
- categoria de GTA 6 = `13155`;
- erros documentados `400`, `401` e `500`; **sem `429` documentado**, mas tratamos `429` (I4).

## Objetivo

Um cliente HTTP da Kick que obtém, guarda e renova o token sozinho e expõe uma chamada GET autenticada e validada para as próximas issues (#49 a #51). Mesmo desenho do cliente da Twitch (spec 027).

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | Token **só em memória**, por instância; nunca no Upstash. | Pedir token é barato; menos superfície de vazamento (igual à Twitch). |
| D2 | Renova com margem de **5 min** antes de vencer; **sem validação periódica** (a Kick não tem o `/validate` da Twitch). Um `401` descarta o token e pede outro, uma vez. | Token de 60 dias; o `401` cobre revogação. |
| D3 | `api(path, params, schema)`: GET em `https://api.kick.com/public/<path>`, parâmetros em array viram repetidos, **schema Zod** na resposta. Timeout de 8 s; 1 nova tentativa para rede e `5xx`. | Padrão do projeto e da Twitch. |
| D4 | Erros: token `400/401/403` → `upstream_config`; API `401` duas vezes → `upstream_config`; `429` → `rate_limited` (espera de `Retry-After`, senão 60 s); outro `4xx` → `upstream_config`; rede, `5xx` ou corpo inválido → `upstream_unavailable`. | `LivesErrorCode` existentes. |
| D5 | Logs só com `logEvent`: novos eventos `kick_token` (`issued`, `discarded`) e `kick_error` (`stage`, `status`, `code`). Nunca URL, cabeçalho, corpo, token ou secret. | Regra de segredos. |
| D6 | `lib/config/server-env.ts`: `kickClientId`, `kickClientSecret` e `kickCategoryId` (padrão `13155`, só dígitos). `isKickConfigured` exige as duas credenciais; `createKickClientFromEnv` devolve `null` sem elas. | "Não configurado" sem rede (CA1). |
| D7 | `lib/kick/client.ts` com `import "server-only"`. O CI já barra `id.kick.com/oauth` e `KICK_CLIENT_SECRET` no bundle do cliente (spec 027). | CA6. |

## Critérios de aceite

1. **CA1:** sem credenciais, `isKickConfigured()` é `false`, `createKickClientFromEnv` devolve `null` e nenhuma chamada de rede acontece.
2. **CA2:** duas chamadas simultâneas sem token geram **um** pedido de token.
3. **CA3:** um `401` dispara um token novo e uma nova tentativa; um segundo `401` vira `upstream_config`.
4. **CA4:** o token renova antes de expirar (relógio falso).
5. **CA5:** nenhum `logEvent` contém o secret ou o token.
6. **CA6:** o módulo não pode ser importado no cliente (`import "server-only"`).

## Fora do escopo

Busca de lives (#49), serviço e registro no agregador (#50), status (#51). Nada fica ativo: a Kick só entra com `kick` em `LIVES_PROVIDERS` e o provedor da #50.

## Riscos e rollback

API recente e em mudança (spec 020): validação Zod na fronteira. Rollback: reverter o PR (nada usa o cliente ainda).
