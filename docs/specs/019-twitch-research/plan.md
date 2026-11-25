# 019 — Plano do spike da Twitch

## Abordagem

1. Chamadas reais feitas pelo responsável, com um app próprio. As credenciais nunca passaram pelo agente nem pelo repositório.
   - Obter o `game_id`, o volume de lives por idioma, conferir a ordenação e ler os cabeçalhos de limite.
2. Ler a documentação oficial: Get Streams, client credentials, rate limits, embed e Developer Agreement.
3. Registrar fatos, inferências, pendências, mapeamento e impacto em `spec.md`.
4. Criar a fixture `tests/fixtures/twitch/streams.json` a partir da resposta real, **anonimizada**:
   - ids, `user_login`, `user_name` e títulos trocados;
   - estrutura e tipos preservados;
   - `tag_ids` vazio e `is_mature: false`, como na API real.

## Arquivos

- `docs/specs/019-twitch-research/spec.md`, `plan.md` e `tasks.md`
- `tests/fixtures/twitch/streams.json`

## Riscos

- **O Developer Agreement impor limites de cache ou de exibição.** Mitigação: P1 é lido antes das issues #41 (TTL do cache) e #45.
