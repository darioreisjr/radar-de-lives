# 013 — Plano

1. Criar `LICENSE` com o texto MIT, `2026` e `Dario Reis`.
2. Conferir contra o modelo oficial do GitHub (`gh api licenses/mit`), que é a base do reconhecimento automático.
3. Adicionar `"license": "MIT"` ao `package.json`, logo depois de `"private": true`.
4. Verificar: lint, typecheck, testes, build; depois do merge, `gh api repos/darioreisjr/radar-de-lives --jq .license.spdx_id`.

Rollback: apagar `LICENSE` e o campo `license`.
