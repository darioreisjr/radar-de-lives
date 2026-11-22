# 009 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente · [!] bloqueado

- [x] T1 Versões e SHAs das actions conferidos em 2026-11-22 (`checkout` v7.0.1, `setup-node` v7.1.0)
- [x] T2 `.github/workflows/ci.yml` criado conforme D1–D8
- [x] T3 YAML validado com `js-yaml` (já presente em `node_modules`): gatilhos `push` e `pull_request`, `permissions: contents: read`, 7 passos, nenhum `secrets.` referenciado — CA3
- [x] T4 Passos do CI rodados numa worktree limpa (sem `node_modules`): `npm ci` ok (binding nativa instalada), lint ok, typecheck ok, testes 106/106, build ok — CA4
- [x] T5 Commit em `sprint/009-ci`
- [x] T6 Push de `sprint/009-ci` → run [45013150638](https://github.com/darioreisjr/radar-de-lives/actions/runs/45013150638) **verde em 33 s**; log confirma `npm ci` (403 pacotes), lint, typecheck, 11 arquivos de teste aprovados e build — CA1
- [x] T7 Branch descartável `sprint/009-ci-falha` (teste de `validation.test.ts` quebrado de propósito) → run [45013243468](https://github.com/darioreisjr/radar-de-lives/actions/runs/45013243468) **falhou na etapa Testes** com `AssertionError`, Build não rodou; branch apagada local e remotamente — CA2
- [x] T8 PR aberto para `main`

## Observação de execução
A pasta principal do projeto estava em `sprint/008-lgpd-privacy` com alterações não commitadas da S-02. Para não interferir, esta tarefa foi feita numa `git worktree` separada, criada a partir de `main`.
