# 023 — Ligar e desligar provedores com `LIVES_PROVIDERS`

Issue [#35](https://github.com/darioreisjr/radar-de-lives/issues/35) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 1 (Fundação) · Branch `sprint/023-provider-flags`

## Contexto

Twitch e Kick vão entrar em produção desligadas e ser ligadas aos poucos: primeiro no Preview, depois em Production (PRD §12.3 RF1; plano, ondas 2 e 3). Para isso, cada plataforma precisa ser ligada e desligada só por configuração, o que também serve de rollback rápido.

## Objetivo

Uma variável de ambiente, lida só no servidor, decide quais provedores o agregador usa. O padrão mantém o comportamento de hoje.

## Escopo

**Inclui**
- `LIVES_PROVIDERS`: lista separada por vírgula. Não diferencia maiúsculas e ignora espaços.
- Funções puras de leitura e seleção em `lib/lives/providers/select.ts`.
- Seleção no servidor (`lib/lives/server.ts`), com logs `config_warning` e `provider_disabled` uma vez por instância.
- Documentação em `.env.example`.

**Não inclui**
- Flags por usuário ou por porcentagem de tráfego, ou serviço de feature flags.
- Provedores da Twitch e da Kick (Fases 2 e 3). Enquanto não existirem, aparecem como "não implementados".

## Regras

| # | Situação | Resultado |
|---|---|---|
| R1 | Variável ausente ou vazia | `youtube` |
| R2 | Valores desconhecidos (ex.: `foo`) | Ignorados; `config_warning` com a **quantidade** ignorada, sem registrar o texto |
| R3 | Repetidos (ex.: `youtube,YouTube`) | Considerados uma vez, na ordem da primeira aparição |
| R4 | Twitch ou Kick listadas sem credenciais, ou ainda não implementadas | Ficam de fora; `provider_disabled` com `platform` e `reason` (`not_configured` ou `not_implemented`) |
| R5 | YouTube listado sem `YOUTUBE_API_KEY` | **Entra**, para manter o estado "busca não configurada" de hoje (`missing_api_key`). Com outra plataforma ativa, a resposta vira parcial (`sources` com o YouTube `ok: false`). |
| R6 | Nenhum provedor sobra depois das regras (ex.: `twitch` sozinho, sem credenciais) | Volta para `youtube`, para nunca ficar sem provedor |
| R7 | A ordem da lista define a ordem de intercalação (spec 022 D3) | `youtube,twitch` → YouTube primeiro |

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | Sem prefixo `NEXT_PUBLIC_`. O cliente fica sabendo das plataformas ativas por `sources` (spec 022). | Configuração só no servidor. |
| D2 | A lógica fica num módulo puro, fora de `server-only`; `server-env.ts` só expõe o texto bruto. | Testável no Vitest sem o runtime do servidor. |
| D3 | O texto bruto de `LIVES_PROVIDERS` entra na assinatura do runtime. | Em desenvolvimento, mudar a variável recria o agregador. Em produção, a mudança exige redeploy (Vercel). |

## Critérios de aceite

1. **CA1:** sem a variável, só o YouTube fica ativo.
2. **CA2:** `LIVES_PROVIDERS=youtube,foo` ativa só o YouTube e registra `config_warning` com `ignored: 1`.
3. **CA3:** `LIVES_PROVIDERS=youtube,twitch` sem provedor ou credenciais da Twitch mantém só o YouTube, sem erro na rota, com `provider_disabled`.
4. **CA4:** `LIVES_PROVIDERS=` (vazio) cai no padrão `youtube`.
5. **CA5:** YouTube sem chave continua ativo (R5), e `twitch` sozinho sem credenciais volta para o YouTube (R6).

## Riscos

- **Rollback:** reverter o PR. Sem a variável, o comportamento é o de hoje.
- **Na Vercel**, mudar a variável só vale depois de um redeploy; isso entra no rollback das issues de ops (#47 e #55).
