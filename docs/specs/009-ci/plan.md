# 009 — Plano

1. Criar `.github/workflows/ci.yml` conforme D1–D8 da spec.
2. Validar localmente: sintaxe do YAML e `npm ci` + `lint`, `typecheck`, `test`, `build` numa cópia limpa (worktree isolada).
3. Commit em `sprint/009-ci` (Conventional Commits pt-BR, sem coautor).
4. **Com autorização do usuário:**
   - push da branch e acompanhamento do run (`gh run list --branch sprint/009-ci`);
   - branch descartável `sprint/009-ci-falha` com um teste quebrado; confirmar a falha, apagar a branch local e a remota;
   - abrir PR para `main`.

Arquivos: só `.github/workflows/ci.yml` e `docs/specs/009-ci/*`.
Rollback: apagar o workflow.
