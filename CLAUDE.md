# Radar de Lives — orientações para agentes

- Processo obrigatório: skill SDD em `.claude/skills/sdd/SKILL.md`. Cada fatia tem `docs/specs/<id>-<slug>/{spec,plan,tasks}.md`.
- Fonte de requisitos: `docs/product/PRD_Radar_de_Lives_GTA6.md`. Não invente requisitos.
- Next.js 16.4 com `cacheComponents: true`. Antes de usar APIs do Next, leia a doc embutida em `node_modules/next/dist/docs/`.
- npm é o gerenciador. Verificações: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- `npm test` usa `scripts/test.mjs` para normalizar a letra do drive no Windows (Vitest quebra com `d:` vs `D:`).
- `YOUTUBE_API_KEY` só no servidor (`lib/config/server-env.ts`, `import "server-only"`). Nunca logar URLs do YouTube (contêm a chave).
- Quota: `search.list` = 100 chamadas/dia (bucket próprio). Qualquer nova chamada ao YouTube precisa passar por `lib/youtube/service.ts` ou `lib/youtube/video-status.ts` (cache, orçamento diário, single-flight).
- UI diz "Lives encontradas", nunca "todas". `concurrentViewers` ausente = `null` ("Não informado").
- Identidade visual própria; não usar logos, fontes, arte ou screenshots oficiais.
- Logs do servidor só via `lib/telemetry.ts` (`logEvent`); nunca IP, chave ou URL do YouTube.
- Cores: `lib/config/design-tokens.ts` e `app/globals.css` precisam bater (teste `tests/contrast.test.ts`). Controles usam `border-strong`.
- Textos de `/privacy` e `/terms` devem refletir o que o código faz; atualize-os ao mudar coleta de dados ou integrações.
