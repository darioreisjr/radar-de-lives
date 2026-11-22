# 013 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente

- [x] T1 Decisão do usuário: MIT, titular Dario Reis, 2026
- [x] T2 `LICENSE` criado; idêntico ao modelo do GitHub (`gh api licenses/mit`, com `[year]`=2026 e `[fullname]`=Dario Reis), exceto uma linha em branco final que o modelo traz — CA1
- [x] T3 `package.json`: `"license": "MIT"`, `"private": true` mantido — CA3
- [x] T4 lint ok · typecheck ok · testes 122/122 · build ok — CA4
- [x] T5 Depois do merge (PR #13, `89ea662`): GitHub reconhece a licença — `gh api repos/darioreisjr/radar-de-lives --jq .license.spdx_id` → `MIT`; `/license` → "MIT License · LICENSE" — CA2
