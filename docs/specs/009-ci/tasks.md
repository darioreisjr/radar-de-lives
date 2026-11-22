# 009 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente · [!] bloqueado

- [x] T1 Versões e SHAs das actions conferidos em 2026-11-22 (`checkout` v7.0.1, `setup-node` v7.1.0)
- [x] T2 `.github/workflows/ci.yml` criado conforme D1–D8
- [x] T3 YAML validado com `js-yaml` (já presente em `node_modules`): gatilhos `push` e `pull_request`, `permissions: contents: read`, 7 passos, nenhum `secrets.` referenciado — CA3
- [x] T4 Passos do CI rodados numa worktree limpa (sem `node_modules`): `npm ci` ok (binding nativa instalada), lint ok, typecheck ok, testes 106/106, build ok — CA4
- [x] T5 Commit em `sprint/009-ci`
- [ ] T6 Push da branch e run verde no GitHub Actions — CA1 (aguarda autorização de push)
- [ ] T7 Branch descartável `sprint/009-ci-falha` com teste quebrado → run vermelho → apagar branch local e remota — CA2 (aguarda autorização de push)
- [ ] T8 Abrir PR para `main` (aguarda autorização)

## Observação de execução
A pasta principal do projeto estava em `sprint/008-lgpd-privacy` com alterações não commitadas da S-02. Para não interferir, esta tarefa foi feita numa `git worktree` separada, criada a partir de `main`.
