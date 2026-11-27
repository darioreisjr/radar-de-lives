# 043 — Plano

1. **`CLAUDE.md`:** trocar as regras só do YouTube por regras por plataforma (segredos, quota/cache, logs), acrescentar `LIVES_PROVIDERS`, rotas, identidade, CSP, prefixo do Redis, logs da Vercel (~1 h) e como adicionar uma plataforma.
2. **`.claude/skills/sdd/SKILL.md`:** "Regras específicas para Radar de Lives" por plataforma.
3. **`README.md`:**
   - descrição, funcionalidades e limitações (inclui o login exigido pelo player da Twitch);
   - "Rodar localmente" com uma subseção "Ligar a Twitch" (CA2);
   - variáveis, API, cache e quota, telemetria, deploy (ligar, desligar e rollback), scripts com as contagens atuais;
   - tabela de specs 019–045.
4. **`sprint.md`:** nota no topo apontando para `docs/plans/multiplataforma.md`.
5. **Verificação:** leitura cruzada com o código (CA1); seguir o README para ligar a Twitch num build local com credenciais falsas e conferir que a plataforma entra na lista de ativas (CA2); lint, typecheck, test e build.

## Arquivos

- **Alterados:** `README.md`, `CLAUDE.md`, `.claude/skills/sdd/SKILL.md`, `sprint.md`
- **Novos:** `docs/specs/043-multiplatform-docs/*`
