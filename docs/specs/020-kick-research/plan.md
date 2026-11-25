# 020 — Plano do spike da Kick

## Abordagem

1. Ler a documentação oficial no repositório `KickEngineering/KickDevDocs` e a especificação OpenAPI em `api.kick.com/swagger/doc.yaml`. Não usar bibliotecas de terceiros como fonte.
2. Extrair da especificação os contratos dos endpoints de livestreams, status por usuário e categorias.
3. Ler o artigo oficial de embed na central de ajuda.
4. Testar a rede sem credenciais: formato do `401`, presença de Cloudflare e cabeçalhos do player.
5. Com credenciais (você): obter a categoria, uma resposta real e o domínio das miniaturas (P1 e P2).
6. Com Preview (você autoriza): testar a partir de um datacenter (P3).
7. Registrar fatos, inferências, pendências, mapeamento e recomendação em `spec.md`.

## Arquivos

- `docs/specs/020-kick-research/spec.md`, `plan.md` e `tasks.md`.
- Depois de P2: `tests/fixtures/kick/livestreams-v2.json`, com a resposta real anonimizada (nomes e ids trocados, sem token).

## Teste de datacenter (P3), quando for autorizado

- Branch descartável `spike/kick-network` (nunca vai para `main`), com a rota `app/api/_spike/kick/route.ts`. A rota:
  - pede o token;
  - chama `GET /public/v2/livestreams?limit=1`;
  - devolve **só** o status HTTP, a latência e se o corpo é JSON. Nada de token nem de dados.
- Credenciais da Kick cadastradas **só em Preview**, pelo painel da Vercel. Depois do teste, apagar a branch e as variáveis.

## Riscos

- **A API mudar de novo durante a implementação.** Mitigação: schemas Zod na fronteira e um teste de contrato com a fixture real.
- **Bloqueio em datacenter.** Mitigação: se P3 falhar, a recomendação passa a ser "adiar", e a Twitch não é afetada.
