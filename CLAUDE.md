# Radar de Lives — orientações para agentes

- Processo obrigatório: skill SDD em `.claude/skills/sdd/SKILL.md`. Cada fatia tem `docs/specs/<id>-<slug>/{spec,plan,tasks}.md`.
- Fonte de requisitos: `docs/product/PRD_Radar_de_Lives_GTA6.md`. Não invente requisitos.
- Next.js 16.4 com `cacheComponents: true`. Antes de usar APIs do Next, leia a doc embutida em `node_modules/next/dist/docs/`.
- npm é o gerenciador. Verificações: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- `npm test` usa `scripts/test.mjs` para normalizar a letra do drive no Windows (Vitest quebra com `d:` vs `D:`).
- `YOUTUBE_API_KEY` só no servidor (`lib/config/server-env.ts`, `import "server-only"`). Nunca logar URLs do YouTube (contêm a chave).
- Estado compartilhado (spec 005): `lib/store` escolhe Upstash (se `UPSTASH_REDIS_REST_*`/`KV_REST_API_*`) ou memória. Falhas do store fecham para o YouTube e abrem para o rate limit. Nunca gravar IP em claro no store.
- `npm install` neste Windows/npm 11 pode apagar do lockfile as bindings opcionais do rolldown (npm/cli#4828). Se `npm test` falhar com `rolldown-binding.wasi.cjs`, apague `node_modules` e `package-lock.json`, reinstale e confira que só o pacote novo mudou.
- Quota: `search.list` = 100 chamadas/dia (bucket próprio). Qualquer nova chamada ao YouTube precisa passar por `lib/youtube/service.ts` ou `lib/youtube/video-status.ts` (cache, orçamento diário, single-flight).
- UI diz "Lives encontradas", nunca "todas". `concurrentViewers` ausente = `null` ("Não informado").
- Identidade visual própria; não usar logos, fontes, arte ou screenshots oficiais.
- Logs do servidor só via `lib/telemetry.ts` (`logEvent`); nunca IP, chave ou URL do YouTube.
- Cores: `lib/config/design-tokens.ts` e `app/globals.css` precisam bater (teste `tests/contrast.test.ts`). Controles usam `border-strong`.
- Textos de `/privacy` e `/terms` devem refletir o que o código faz; atualize-os ao mudar coleta de dados ou integrações.
- Vercel CLI 59.x: `vercel env rm <nome> <ambiente>` apagou a variável de **todos** os ambientes (ocorrido em 2026-11-21). Para mudar ambientes de uma variável, use o painel. `vercel link` também baixa variáveis para `.env.local` e altera o `.gitignore`: confira com `git diff` depois.
- Commits: Conventional Commits em pt-BR (ex.: `feat(cache): adiciona cache compartilhado no Upstash`), **sem** linha `Co-Authored-By`. Pedido do usuário em 2026-11-21.
- CSP aplicada em `next.config.ts` (`contentSecurityPolicy`, spec 017): nova origem externa (imagem, script, iframe, API chamada do navegador) precisa entrar nela. `npm run test:e2e` (Playwright, spec 014) falha em qualquer violação; rode-o ao mexer em UI, player ou cabeçalhos.
- Trabalho pendente organizado em `sprint.md`; cada tarefa usa a branch `sprint/<id>` e só altera os arquivos listados.
