# 043 — Tarefas

- [x] `CLAUDE.md` com regras por plataforma: segredos, `LIVES_PROVIDERS`, nova plataforma, identidade por `id`, rotas, prefixo do Redis, quota e limites, player, logs (~1 h), CSP, testes sem APIs reais.
- [x] Skill SDD: "Regras específicas" generalizadas; IDs reservados nas issues.
- [x] `README.md`: descrição, funcionalidades, limitações (login da Twitch, tela estreita, lista intercalada), "Ligar a Twitch", variáveis, scripts (259 e 72 testes), API (`sources`, `/api/status`, obsoletos), cache e ambientes, telemetria, ligar/desligar/conferir, pendências, CI e tabela de specs 019–045.
- [x] `sprint.md`: nota apontando para o épico #28 e o plano multiplataforma.

## CA1 — leitura cruzada com o código (2026-11-27)

| Regra documentada | Conferido em | Resultado |
|---|---|---|
| `LIVES_PROVIDERS` padrão `youtube`; sem credenciais a Twitch fica de fora | `lib/lives/providers/select.ts`, `lib/lives/active-platforms.ts`, `tests/copy.test.ts` | OK |
| Credenciais e token só no servidor; CI barra o bundle | `lib/config/server-env.ts`, `lib/twitch/client.ts`, `.github/workflows/ci.yml` | OK |
| `id = <plataforma>:<sourceId>`, `videoId` obsoleto, `withIdentity` | `lib/lives/identity.ts`, `lib/lives/types.ts` | OK |
| Rotas `/api/lives` (com `sources`), `/api/status/[platform]/[id]`, `/api/lives/[videoId]` obsoleta | `app/api/**` | OK |
| Falha do store fecha YouTube e Twitch | `lib/youtube/service.ts`, `lib/twitch/service.ts` (D3) | OK |
| Prefixo `preview:`/`development:`; Production sem prefixo | `lib/store/upstash.ts` | OK |
| Twitch: 1 página, cache 180 + 600 s, `TWITCH_*` com padrões e faixas | `lib/config/server-env.ts`, `lib/twitch/search.ts` | OK |
| `LIVE_RATE_LIMIT_SECONDS` vale para as duas plataformas | `lib/lives/server.ts` (`minUpstreamIntervalMs`) | OK |
| CSP: origens de imagem e iframe; `connect-src 'self'` | `next.config.ts` | OK |
| Eventos de telemetria listados | `lib/telemetry.ts` | OK |
| Player: `parent`, 400×300, aviso de login | `lib/lives/platforms.ts` | OK |
| Contagem de testes | `npm test` (26/259), `npm run test:e2e` (72) | OK |

## CA2 — ligar a Twitch seguindo só o README

- [x] Servidor de desenvolvimento (porta 3200) com as variáveis da seção "Ligar a Twitch" (`LIVES_PROVIDERS=youtube,twitch` e credenciais **falsas**), sem chave do YouTube e sem Upstash:
  - a Twitch entrou como plataforma ativa: o servidor pediu o token e registrou `twitch_error` (`stage: token`, `upstream_config`), esperado com credenciais falsas;
  - `/api/status/twitch/<login inválido>` → `400`.
  - Com credenciais reais, o mesmo caminho foi validado no Preview e em produção (#47).

## Verificação

- [x] lint e typecheck: ok; `npm test`: 26 arquivos, 259 testes; `npm run build`: ok. Sem mudança de código (e2e não obrigatório).

## Pendências levadas ao responsável

- [ ] Remover `videoId`, a rota `/api/lives/[videoId]` e `source`? Se sim, issue própria.
- [ ] Renumerar as specs reservadas nas issues da Kick (#48 a #54 citam 035–041; 035 e 036 já foram usadas).
- [ ] `.env.example` sem `TWITCH_CACHE_TTL_SECONDS` e `TWITCH_STALE_TTL_SECONDS` (fora dos arquivos permitidos).
- [ ] Spec 044: marcar a conferência em produção (feita e registrada na #86).
