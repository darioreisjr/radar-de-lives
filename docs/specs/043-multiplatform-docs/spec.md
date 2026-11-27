# 043 — Documentação multiplataforma (README, CLAUDE.md e skill SDD)

Issue [#57](https://github.com/darioreisjr/radar-de-lives/issues/57) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 4 (Encerramento) · Branch `sprint/043-multiplatform-docs`

## Contexto

`README.md`, `CLAUDE.md`, a skill SDD e o `sprint.md` descrevem um site só do YouTube. Desde as specs 019–045, o site busca no YouTube e na Twitch, tem rota de status por plataforma, identidade por `id`, novas origens na CSP, variáveis da Twitch e chaves separadas no Redis por ambiente. Pela regra do sprint, `README.md` e `CLAUDE.md` só mudam numa tarefa de consolidação: esta.

## Objetivo

A documentação para pessoas e para agentes reflete o projeto multiplataforma, sem contradizer o código.

## Escopo

**Inclui**
- `CLAUDE.md`: segredos da Twitch (e da Kick, quando vier), `LIVES_PROVIDERS`, CSP com as origens novas, deduplicação por `id`, rota `/api/status/[platform]/[id]`, prefixo do Redis por ambiente, como adicionar uma plataforma.
- Skill SDD: "Regras específicas" generalizadas por plataforma.
- `README.md`: plataformas, variáveis, como ligar e desligar cada uma, API, telemetria, deploy, testes e a tabela de specs.
- `sprint.md`: nota apontando para o plano multiplataforma.

**Não inclui**
- Mudança de código.
- Remoção dos itens obsoletos (vai para a #90).

**Ampliação autorizada pelo responsável (2026-11-27):**
- `.env.example`: documentar `TWITCH_CACHE_TTL_SECONDS` e `TWITCH_STALE_TTL_SECONDS`.
- `docs/specs/044-twitch-login-notice/tasks.md`: marcar a conferência em produção.
- Corpo das issues da Kick (#48 a #54): specs renumeradas de 035–041 para 046–052.

## Fatos conferidos no código (2026-11-27)

| Tema | Fonte |
|---|---|
| Plataformas e ordem de intercalação: `LIVES_PROVIDERS` (padrão `youtube`); a Twitch exige `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET`. | `lib/lives/providers/select.ts`, `lib/lives/server.ts` |
| Variáveis da Twitch: `TWITCH_GAME_ID` (1867279146), `TWITCH_MAX_PAGES` (1, faixa 1–3), `TWITCH_CACHE_TTL_SECONDS` (180, 30–3600), `TWITCH_STALE_TTL_SECONDS` (600, 0–3600). | `lib/config/server-env.ts` |
| Identidade `id = <plataforma>:<sourceId>`; `videoId` obsoleto (igual a `sourceId`). | `lib/lives/identity.ts`, `lib/lives/types.ts` |
| Rotas: `GET /api/lives` (com `sources`), `GET /api/status/[platform]/[id]`; `GET /api/lives/[videoId]` obsoleta (delega à de status). Campo `source` só distingue `"fixture"` dos dados reais. | `app/api/**` |
| CSP: `img-src` com `i.ytimg.com` e `static-cdn.jtvnw.net`; `frame-src` com `www.youtube.com` e `player.twitch.tv`; `connect-src 'self'`. | `next.config.ts` |
| Redis: Production sem prefixo; Preview `preview:`; Development `development:`. | `lib/store/upstash.ts` (spec 036) |
| Eventos de telemetria: `provider_failed`, `config_warning`, `provider_disabled`, `twitch_token`, `twitch_error`, `twitch_call`, além dos do YouTube e do store. | `lib/telemetry.ts` |
| CI: o bundle do cliente não pode conter o endpoint de token nem os nomes das credenciais da Twitch e da Kick. | `.github/workflows/ci.yml` |
| Testes: 26 arquivos, 259 unitários; 72 e2e (36 por perfil). | `npm test`, `npm run test:e2e` |

## Decisões do responsável (2026-11-27)

| ID | Decisão |
|---|---|
| D1 | Remover `videoId`, a rota `/api/lives/[videoId]` e `source` numa issue própria: [#90](https://github.com/darioreisjr/radar-de-lives/issues/90) (spec 053 reservada). |
| D2 | Renumerar as specs da Kick para 046–052 (035 e 036 já foram usadas por correções da Twitch). |
| D3 | Incluir neste PR os dois ajustes fora dos arquivos da issue (`.env.example` e spec 044). |

## Critérios de aceite

1. **CA1:** nenhuma regra de `CLAUDE.md` ou da skill contradiz o código atual (leitura cruzada registrada em `tasks.md`).
2. **CA2:** uma pessoa nova consegue ligar a Twitch localmente seguindo só o README.

## Rollback

Reverter o PR.
