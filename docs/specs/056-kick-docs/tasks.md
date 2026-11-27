# 056 — Tarefas

- [x] `README.md`: Kick na descrição, status (ativa desde 2026-11-27), funcionalidades (selo "Kick", "Abrir na Kick", player sem login, sem selo adulto), limitações (cobertura, qualidade do embed, lista intercalada), "Ligar a Kick", variáveis `KICK_*`, API, cache e ambientes, eventos `kick_*`, ligar/desligar (ensaio com a Kick), contagens (327 unitários; 84 e2e), tabela de specs 046–056.
- [x] `CLAUDE.md`: Kick em produção; `KICK_CLIENT_ID`/`KICK_CLIENT_SECRET`, tokens em memória, `stream.key`/`stream.url` nunca lidos; `lib/kick/service.ts` e `lib/kick/status.ts`, paginação e corte nas 100 maiores, cache e termos; player da Kick e foco (spec 055); selo e 16 anos; CSP.
- [x] Skill SDD: três plataformas; termos da Kick no exemplo de cache.

## CA1 — leitura cruzada (2026-11-27)

| Regra documentada | Conferido em | Resultado |
|---|---|---|
| Variáveis `KICK_*` e padrões (13155, 180, 600) | `lib/config/server-env.ts` | OK |
| Token em memória; Bearer; `429` com `Retry-After` | `lib/kick/client.ts` | OK |
| v2, cursor até 5 páginas, pt/en/es, 100 maiores, sem selo adulto | `lib/kick/search.ts`, `lib/kick/normalize.ts` | OK |
| Status por slug em `/public/v1/channels`; schema sem `key`/`url`; slug até 25 | `lib/kick/status.ts` | OK |
| CSP com `images.kick.com`, `web.kick.com`, `player.kick.com` | `next.config.ts` | OK |
| Player `player.kick.com/<slug>`, sem login nem mínimo | `lib/lives/platforms.ts` | OK |
| Foco devolvido na hora | `components/lives/live-player-dialog.tsx` (spec 055) | OK |
| 16 anos | `app/terms/page.tsx`, `app/privacy/page.tsx` | OK |
| Eventos `kick_token`, `kick_error`, `kick_call` | `lib/telemetry.ts` | OK |
| Contagens de testes | `npm test` (32/327), `npm run test:e2e` (84) | OK |

## CA2

- [x] O passo a passo "Ligar a Kick" segue o mesmo caminho validado na #55 (app com 2FA, credenciais em `.env.local`/Preview, `LIVES_PROVIDERS` com `kick`, conferência de `sources`).

## Verificação

- [x] lint, typecheck, `npm test` e build (sem mudança de código).
