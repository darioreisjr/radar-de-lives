# 013 — Licença do repositório

Tarefa S-08 do [sprint.md](../../../sprint.md). Branch `sprint/013-license`.

## Contexto

O repositório `darioreisjr/radar-de-lives` é público e não tinha `LICENSE`. Sem licença, todos os direitos ficam reservados e ninguém pode reutilizar o código legalmente.

## Decisão do usuário (2026-11-22)

- **Licença:** MIT.
- **Titular:** Dario Reis (mesmo nome do controlador em `siteConfig.legal`).
- **Ano:** 2026.

## Escopo

Incluído: `LICENSE` (novo), campo `"license": "MIT"` em `package.json` (mantendo `"private": true`), esta spec.
Excluído: README e CLAUDE.md (a sprint reserva esses arquivos para a S-06); cabeçalhos de licença em arquivos de código.

## O que a licença não cobre

- Marcas de terceiros: GTA, Grand Theft Auto, Rockstar Games, Take-Two Interactive, YouTube.
- Miniaturas, títulos e demais metadados de lives exibidos pelo site, que pertencem aos criadores e ao YouTube.
- A skill `unslop` (Damir Sokolovsky, CC BY 4.0) usada no visual: o crédito continua no README e na spec 007 e deve ser mantido.

## Notas

- `"private": true` continua: impede publicação acidental no npm e não conflita com a licença.
- `package-lock.json` não foi alterado (fora da lista da tarefa). O campo `license` da raiz do lockfile pode aparecer no próximo `npm install`; isso não afeta `npm ci`.
- Sugestão para uma rodada futura da S-06: citar a licença no README, com a ressalva sobre marcas e conteúdo de terceiros.

## Critérios de aceite

1. **CA1** `LICENSE` com o texto oficial da MIT, ano 2026 e titular "Dario Reis".
2. **CA2** O GitHub reconhece a licença na página do repositório depois do merge.
3. **CA3** `package.json` com `"license": "MIT"` e `"private": true`.
4. **CA4** lint, typecheck, testes e build verdes.
