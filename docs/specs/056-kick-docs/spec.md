# 056 — Documentação da Kick (README, CLAUDE.md e skill SDD)

Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 4 (Encerramento) · Branch `sprint/056-kick-docs` · Repete a consolidação da spec 043 (#57) para a Kick, como pede o plano ("atualizar o #57 depois da #55").

## Contexto

A Kick entrou em produção em 2026-11-27 (#55; specs 046 a 052). `README.md`, `CLAUDE.md` e a skill SDD ainda dizem que a Kick depende do spike #31.

## Objetivo

A documentação reflete as três plataformas, sem contradizer o código.

## Escopo

- `README.md`: descrição, status, funcionalidades e limitações com a Kick; seção "Ligar a Kick"; variáveis `KICK_*`; API (`sourceId` e status da Kick); cache, ambientes e telemetria (`kick_*`); ligar/desligar com o exemplo da Kick; contagens de testes; tabela de specs 046–056.
- `CLAUDE.md`: Kick em produção; segredos e tokens da Kick (e `stream.key` descartado); quota/limites e paginação da Kick; player da Kick; selo e idade mínima; CSP com as origens da Kick.
- Skill SDD: as três plataformas e os termos da Kick.

**Fora:** código.

## Critérios de aceite

1. **CA1:** nenhuma regra de `CLAUDE.md` ou da skill contradiz o código atual (leitura cruzada em `tasks.md`).
2. **CA2:** uma pessoa nova consegue ligar a Kick localmente seguindo só o README.
