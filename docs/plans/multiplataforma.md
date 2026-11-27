# Plano de resolução — Lives da Twitch (e depois da Kick)

Este plano coloca no ar as issues do épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28): primeiro a **Twitch**, depois a **Kick**, sem afetar o que já funciona com o YouTube.

- **Para quem:** o responsável pelo produto (decisões e painéis) e os agentes que vão implementar as issues.
- **Criado em:** 2026-11-25. Na criação, todas as issues estavam abertas e nenhuma tinha começado.
- **Como usar:** siga as ondas na ordem. Cada onda termina num **portão** que precisa estar verde antes da próxima. Cada issue vira **um PR** e segue a skill SDD (`.claude/skills/sdd/SKILL.md`): `spec.md`, `plan.md` e `tasks.md` antes do código.

---

## 1. O que significa "no ar"

A Twitch está no ar quando:

1. `LIVES_PROVIDERS=youtube,twitch` está ativo em **Production**.
2. A home mostra lives do YouTube e da Twitch, cada card com o selo da plataforma, e o filtro "Plataforma" funciona.
3. Uma live da Twitch abre no **player embutido**, com o link "Assistir na Twitch" como alternativa.
4. Lives marcadas como adultas aparecem com o selo "Conteúdo adulto".
5. Se a Twitch cair, o YouTube continua aparecendo, com o aviso "Algumas plataformas estão indisponíveis agora".
6. `/privacy` e `/terms` citam a Twitch.
7. Passaram 48 h sem erro recorrente nos logs e sem mudança no consumo de quota do YouTube.

A Kick segue o mesmo critério numa segunda leva, **se** o spike [#31](https://github.com/darioreisjr/radar-de-lives/issues/31) recomendar seguir.

---

## 2. Decisões

### Tomadas em 2026-11-25

| ID | Decisão | Efeito no plano |
|---|---|---|
| D2 | **Twitch primeiro.** Kick numa segunda leva, só se o spike #31 aprovar. | As ondas 1 a 5 levam a Twitch ao ar. A Kick é a onda 6. |
| D3 | **Player embutido**, com link para a plataforma como alternativa. | #43 libera `frame-src` na CSP. #44 usa o parâmetro `parent` da Twitch. |
| D6 | **Conteúdo adulto aparece, com aviso.** | Novo campo `isMature` no modelo (#33), selo no card (#38) e mapeamento de `is_mature` (#40). Ver a seção 3. |

### Aprovadas em 2026-11-25 (recomendações aceitas)

| ID | Decisão | Onde pesa |
|---|---|---|
| D1 | Entra agora, antes de outras funcionalidades. | Ordem geral |
| D4 | Uma lista única, com filtro por plataforma. | #38 |
| D5 | "Relevância" intercala as plataformas pelo `rank` de cada uma. | #34 |
| D7 | Idiomas continuam pt, en e es; o resto vira `unknown`. | #40 |
| D8 | O mesmo streamer em duas plataformas aparece duas vezes. | #34 |
| D9 | A UI diz "Lives encontradas", nunca "todas". | #46 |

**Ação:** levar D1 a D9 para o PRD pela issue [#32](https://github.com/darioreisjr/radar-de-lives/issues/32), depois dos spikes #30 e #31. Os termos das plataformas podem exigir ajuste em D3 ou D6. Nenhuma issue da Fase 1 começa antes disso.

---

## 3. Ajustes nas issues encontrados ao montar este plano

Ao abrir o PR de cada issue, aplique o ajuste correspondente e registre-o na `spec.md`. Se preferir, antes comente o ajuste na própria issue.

| Issue | Ajuste | Motivo |
|---|---|---|
| [#33](https://github.com/darioreisjr/radar-de-lives/issues/33) | Incluir `e2e/support.ts` nos arquivos permitidos. | Ele importa `LiveItem` e `VideoStatusPayload` de `lib/youtube/types`, e as fábricas de dados do e2e precisam dos campos novos. |
| #33 | Adicionar ao `LiveItem` o campo `isMature: boolean`. No YouTube, sempre `false`. | Decisão D6. O YouTube não tem esse campo na busca. |
| #33 | **Primeiro commit:** um teste de caracterização (seção 5.2) que grava o payload atual de `/api/lives` com fixtures. | Prova automática de que a Fase 1 não muda nada visível. |
| [#34](https://github.com/darioreisjr/radar-de-lives/issues/34) | Definir a paginação: `pageToken` continua só do YouTube. Na primeira página, os outros provedores entram; nas páginas seguintes, só o YouTube. | `app/api/lives/route.ts` aceita `pageToken`, que só existe no YouTube. |
| #34 | Os filtros `q`, `lang` e `sort` (`applyLiveFilters`) são aplicados **depois** da agregação. | Hoje são aplicados na rota sobre o resultado do YouTube. |
| [#38](https://github.com/darioreisjr/radar-de-lives/issues/38) | Incluir o selo "Conteúdo adulto", com contraste testado. | Decisão D6. |
| #38 | Se o filtro de plataforma rodar no servidor, incluir `lib/validation/lives-query.ts` e `tests/validation.test.ts` nos arquivos permitidos. **Recomendado:** filtrar no cliente, como o filtro de idioma. | A rota valida os parâmetros com Zod. |
| [#40](https://github.com/darioreisjr/radar-de-lives/issues/40) | Mapear `is_mature` para `isMature`. | Decisão D6. |
| [#45](https://github.com/darioreisjr/radar-de-lives/issues/45) | Mudar `siteConfig.legal.updatedAt` **mostra o aviso de aceite de novo a todos os visitantes**. Fazer isso de propósito, junto com a ativação em Production. | Comportamento da spec 016. |
| #45 | Atualizar já os registros de legítimo interesse e de transferência internacional (o player da Twitch envia dados do visitante para a Twitch). | Hoje a revisão desses registros só está prevista para 23/11/2027, na [#29](https://github.com/darioreisjr/radar-de-lives/issues/29). |
| [#47](https://github.com/darioreisjr/radar-de-lives/issues/47) | Incluir o smoke test pós-deploy (seção 5.6) e o ensaio de rollback (seção 6). | Prova de que o rollback funciona antes de precisar dele. |

A issue **#29** (revisão anual de LGPD em 23/11/2027) **não faz parte deste plano**. Só o ajuste acima toca nela.

---

## 4. Ondas de execução

```
Onda 0  #30 spike Twitch ──┐      #31 spike Kick (em paralelo; só a onda 6 depende dele)
                           └──► #32 PRD ──► PORTÃO G0
Onda 1  #33 ─► #34 ─► #35 ─┬─► #36 ─► #37
                           └─► #38              ──► PORTÃO G1 (produção sem mudança visível)
Onda 2  #39 ─► #40 ─► #41 ─► #42 ─┐
        #43 ──────────────────────┼─► #44
        #45 · #46 (em paralelo)   ┘           ──► PORTÃO G2 (tudo em main, Twitch desligada)
Onda 3  #47 Preview ─► #47 Production         ──► PORTÃO G3 (Twitch no ar)
Onda 4  #56 QA · #57 documentação             ──► PORTÃO G4 (épico pronto para a Twitch)
Onda 5  monitoramento de 48 h e ajustes
Onda 6  Kick: #48 a #55, se o #31 aprovar; depois #56 e #57 de novo
```

### Onda 0 — Descoberta e decisão

| Issue | Quem | O que entrega |
|---|---|---|
| [#30](https://github.com/darioreisjr/radar-de-lives/issues/30) spike Twitch | Agente; você faz uma chamada real com as suas credenciais | `docs/specs/019-twitch-research/` com fatos confirmados, `game_id` de GTA 6, tabela de campos e fixture real anonimizada em `tests/fixtures/twitch/` |
| [#31](https://github.com/darioreisjr/radar-de-lives/issues/31) spike Kick | Agente; você faz o teste a partir de um Preview | Recomendação: seguir, adiar ou não seguir |
| [#32](https://github.com/darioreisjr/radar-de-lives/issues/32) PRD | Agente redige; você aprova | PRD com a seção Multiplataforma e D1 a D9 |

**Portão G0:**
- [ ] O #30 recomenda seguir.
- [ ] O PRD está em `main`, com D1 a D9.
- [ ] A fixture real da Twitch está no repositório, sem dados sensíveis.

### Onda 1 — Fundação

Ordem obrigatória: #33 → #34 → #35. Depois, #36 → #37 e #38 podem correr em paralelo.

| Issue | Tamanho | Ponto de atenção |
|---|---|---|
| [#33](https://github.com/darioreisjr/radar-de-lives/issues/33) modelo neutro | M | Começar pelo teste de caracterização. Renomear sem mudar comportamento. |
| [#34](https://github.com/darioreisjr/radar-de-lives/issues/34) agregador | G | Manter a chave de cache do YouTube (`lives`) para não gastar quota extra no deploy. |
| [#35](https://github.com/darioreisjr/radar-de-lives/issues/35) `LIVES_PROVIDERS` | P | Padrão `youtube`; vazio também vira `youtube`. |
| [#36](https://github.com/darioreisjr/radar-de-lives/issues/36) rota de status | M | Nova rota em `/api/status/[platform]/[id]`. O Next não aceita `[platform]/[id]` ao lado de `[videoId]` em `/api/lives`. |
| [#37](https://github.com/darioreisjr/radar-de-lives/issues/37) player genérico | M | A assinatura de `embedSrc` já recebe `hostname`. |
| [#38](https://github.com/darioreisjr/radar-de-lives/issues/38) selo, filtro, aviso parcial e selo adulto | M | Tudo escondido enquanto só houver uma plataforma ativa. |

**Portão G1** (cada PR pode ir para produção assim que fizer merge):
- [x] O teste de caracterização passa sem mudança no snapshot.
- [x] A suíte e2e passa nos dois perfis (`desktop` e `mobile-375`).
- [x] Depois do deploy em produção, a home fica igual e `GET /api/lives` traz `sources` com só o YouTube.
- [x] Nas 24 h seguintes, o consumo de `search.list` fica dentro da média dos dias anteriores. Conferido em 2026-11-27: contador diário em **2 de 90** buscas às 06:28 UTC (~200 de 10.000 unidades), sem `budget_exhausted`.

### Onda 2 — Twitch no código, desligada

O código vai para `main` e para produção, mas fica **inativo** até a onda 3, porque `LIVES_PROVIDERS` não inclui `twitch`.

| Issue | Depende de | Tamanho |
|---|---|---|
| [#39](https://github.com/darioreisjr/radar-de-lives/issues/39) cliente e token | G1, #30 | M |
| [#40](https://github.com/darioreisjr/radar-de-lives/issues/40) busca e normalização | #39 | M |
| [#41](https://github.com/darioreisjr/radar-de-lives/issues/41) serviço e agregador | #40 | M |
| [#42](https://github.com/darioreisjr/radar-de-lives/issues/42) status individual | #41, #36 | P |
| [#43](https://github.com/darioreisjr/radar-de-lives/issues/43) CSP | #30 | P (pode correr em paralelo desde o início da onda) |
| [#44](https://github.com/darioreisjr/radar-de-lives/issues/44) player embutido | #42, #43, #37 | M |
| [#45](https://github.com/darioreisjr/radar-de-lives/issues/45) textos legais | #30, #32 | P (em paralelo) |
| [#46](https://github.com/darioreisjr/radar-de-lives/issues/46) textos do site | #35 | P (em paralelo) |

**Portão G2:**
- [ ] As 8 issues estão em `main`, com o CI verde.
- [ ] A produção continua igual: a Twitch está desligada.
- [ ] Rodando localmente com `LIVES_PROVIDERS=youtube,twitch` e credenciais reais (só com sua autorização), a home mostra as duas plataformas.

### Onda 3 — Liberação da Twitch ([#47](https://github.com/darioreisjr/radar-de-lives/issues/47))

1. **Você:** cria o app no console da Twitch e cadastra `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` e `TWITCH_GAME_ID` **só em Preview**, pelo **painel** da Vercel. Não use `vercel env rm`.
2. Em Preview, `LIVES_PROVIDERS=youtube,twitch`. Rodar o checklist do Preview da #47 e o smoke test (seção 5.6).
3. Cadastrar as mesmas variáveis em Production. Ativar a Twitch **no mesmo deploy** que publica o texto legal (#45).
4. Smoke test em produção.
5. **Ensaio de rollback** (seção 6), uma vez, logo após a ativação.

**Portão G3:**
- [x] Os 7 critérios da seção 1 estão confirmados em produção (ativação em 2026-11-25, registrada na #47; o critério 7 está na onda 5).
- [x] O ensaio de rollback foi feito e a Twitch foi reativada (2026-11-25: desligar em 34 s, religar em 39 s; #47).

### Onda 4 — Encerramento da Twitch

- [#56](https://github.com/darioreisjr/radar-de-lives/issues/56): QA manual completo (seção 5.7).
- [#57](https://github.com/darioreisjr/radar-de-lives/issues/57): README, `CLAUDE.md` e a skill SDD atualizados.

**Portão G4:**
- [ ] O QA não deixou bug aberto de prioridade P1.
- [ ] A documentação bate com o código.

### Onda 5 — Monitoramento

Durante 48 h, acompanhe:
- os logs (`provider_failed`, rate limit da Twitch);
- os alertas de uso e de quota (S-13);
- o Web Analytics.

Se encontrar um bug, abra uma issue ligada ao #28.

#### Registro (Twitch, de 2026-11-25 a 2026-11-27)

**Limite:** os logs de runtime da Vercel duram ~1 h. O acompanhamento foi feito por **checagens pontuais** (decisão de 2026-11-25), sem Log Drain. Cada checagem cobre só a última hora.

| Data (UTC) | Janela | Resultado |
|---|---|---|
| 2026-11-25 | 20:07–20:55 | 0 erros; 6 `twitch_call` com 97 a 100 itens |
| 2026-11-25 | após o deploy da #82 | Preview e produção com chaves separadas no Redis (CA4 da spec 036) |
| 2026-11-27 | 05:34–06:34 | 0 `twitch_error`, `provider_failed`, `stale_served`, `store_error`, `config_warning`, `budget_exhausted`, `route_error`; 0 respostas 429/5xx; 0 logs de erro ou aviso; `twitch_call` com 96 itens |

**Ajustes feitos no período:**
- [#78](https://github.com/darioreisjr/radar-de-lives/issues/78) (spec 035): busca da Twitch limitada a 1 página por padrão (`TWITCH_MAX_PAGES`); a lista caiu de ~350 para ~150 lives.
- [#81](https://github.com/darioreisjr/radar-de-lives/issues/81) (spec 036): Preview e Development com prefixo próprio no Redis, depois que um Preview antigo gravou 293 lives no cache da produção. Os 55 Previews antigos foram apagados.

**Não conferido pelo agente:** alertas de uso e de quota (S-13) e Web Analytics, que ficam no painel.

**Conclusão:** critério 7 da seção 1 atendido nas janelas observadas. Monitoramento de 48 h da Twitch encerrado.

### Onda 6 — Kick (segunda leva)

Só começa se o #31 recomendar seguir. Sequência igual à da onda 2: #48 → #49 → #50 → #51, com #52 em paralelo; depois #53 e #54; e por fim a liberação pela #55. Em seguida, rode de novo o #56 e atualize o #57.

A Fase 1 já preparou tudo, então a Kick **não mexe** em modelo, agregador, filtro ou textos do site.

**Estado do #31 (2026-11-27):** P1, P2 e P4 concluídos; falta P3 (teste a partir de um Preview). Recomendação provisória: **seguir com ressalvas**. Condições levadas para as issues (detalhes na spec 020):
- **#49:** categoria `13155`; ~1800 lives em 2 páginas, da mais antiga para a mais nova → seguir o cursor, filtrar pt/en/es pelo prefixo e ficar com as 100 maiores por espectadores.
- **#50:** cache curto (≤ 24 h pelos termos; sugestão 180 s); token de 60 dias em memória.
- **#52:** `img-src https://images.kick.com https://web.kick.com`; `frame-src https://player.kick.com`.
- **#53:** conferir no P3 se o player pede login para conteúdo adulto.
- **#54:** atribuição sem logo; `/api/lives` como uso interno (proibição de re-distribuição); site não voltado a menores de 16.
- **Selo adulto:** não mostrar na Kick (decisão D-K1: 98% da categoria vem marcada).

---

## 5. Estratégia de testes

Princípios, que já valem no projeto:

- **Nenhum teste chama as APIs reais** do YouTube, da Twitch ou da Kick. O CI não tem segredos.
- Não enfraquecer nem apagar testes para ficar verde.
- **Todo critério de aceite (CA) tem pelo menos um teste** ou uma verificação registrada no `tasks.md` da spec.
- Comandos antes de cada commit: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`. Se mexer em UI, player, rotas ou cabeçalhos, também `npm run test:e2e`.

### 5.1 Camadas

| Camada | Ferramenta | Onde | O que cobre |
|---|---|---|---|
| Unidade | Vitest (`environment: node`) | `tests/*.test.ts` | Normalizadores, filtros, agregador, serviço, cliente e token, status, configuração, CSP, telemetria |
| Contrato | Vitest + Zod | `tests/*-contract.test.ts` | Os schemas Zod aceitam as **respostas reais anonimizadas** capturadas nos spikes |
| Rota | Vitest, chamando o `GET` exportado da rota com `NextRequest` e serviços falsos | `tests/routes/*.test.ts` (novo) | Status HTTP, corpo, `Cache-Control`, rate limit e validação de parâmetros |
| Caracterização | Vitest com snapshot | `tests/characterization.test.ts` (novo, #33) | O payload do YouTube não muda durante a Fase 1 |
| Interface | Playwright (`desktop` e `mobile-375`) | `e2e/*.spec.ts` | Home, filtros, player, estados, teclado, movimento reduzido e violação de CSP |
| Smoke | `curl` + Playwright com `E2E_BASE_URL` | Preview e produção | Dados reais com `sources` corretas; UI no deploy |
| Manual | Roteiro | `docs/specs/042-multiplatform-qa/` | Leitor de tela, temas, larguras, player real |

### 5.2 Teste de caracterização (proteção da Fase 1)

1. Em #33, **antes de mudar qualquer código**, criar `tests/characterization.test.ts`. Ele roda o serviço do YouTube com o `fetch` falso e as fixtures existentes e grava o payload de `/api/lives` em snapshot, cobrindo as combinações de `lang`, `sort` e `q`.
2. Nas issues #33 a #38, o snapshot só pode mudar para **acrescentar** campos (`platform`, `id`, `sourceId`, `isMature`, `sources`). Nenhum valor existente pode mudar.
3. Qualquer outra diferença no snapshot bloqueia o PR.

### 5.3 Matriz de testes por issue

**Fase 1 — Fundação**

| Issue | Unidade e contrato | Rota | e2e |
|---|---|---|---|
| #33 | `dedupeById`; ids iguais em plataformas diferentes **não** são deduplicados; id do DOM com `:` vira id válido; `isMature=false` no YouTube | — | Toda a suíte atual passa; fábricas de `e2e/support.ts` atualizadas |
| #34 | `Promise.allSettled`: 1 provedor falha → resultado parcial; todos falham → mesmo erro de hoje; timeout por provedor; intercalação pelo `rank`; filtros depois da agregação; contagem de chamadas ao YouTube igual | `/api/lives`: 200 parcial, erro total com o mesmo status HTTP, `pageToken` só no YouTube | Toda a suíte atual passa |
| #35 | Variável ausente, vazia, com valor desconhecido, ou provedor sem credenciais → resultado e log esperados | — | — |
| #36 | Validador de id por plataforma | `/api/status/youtube/<id>` igual a `/api/lives/<id>`; plataforma inativa → 400; id inválido → 400; rate limit; `no-store` | — |
| #37 | `embedSrc` do YouTube idêntica à de hoje; plataforma sem embed → modo só-link | — | O player chama `/api/status/youtube/<id>`; modo só-link passa nos testes de teclado e foco |
| #38 | `radar-stats` por plataforma; filtro de plataforma combinado com idioma e ordenação; contraste dos selos nos dois temas | — | Com 1 plataforma: nada novo aparece. Com fixture de várias: selos, filtro e aviso parcial com `role="status"` e o selo "Conteúdo adulto" |

**Fase 2 — Twitch**

| Issue | Unidade e contrato | Rota | e2e |
|---|---|---|---|
| #39 | Sem credenciais → nenhuma chamada; token com single-flight; `401` → renova e repete uma vez; segundo `401` → `upstream_config`; renovação antes de expirar (relógio falso); timeout; **nenhum `logEvent` com secret ou token** | — | — |
| #40 | **Contrato:** a fixture real do #30 passa no schema. Mapeamento de cada campo; `viewer_count` ausente → `null`; `language` fora de pt/en/es → `unknown`; `is_mature` → `isMature`; troca de `{width}x{height}`; item inválido descartado e o resto segue; miniatura sempre em HTTPS | — | — |
| #41 | Twitch desligada → nenhuma chamada; cache por TTL; single-flight; stale quando a Twitch falha; `429` respeita `Ratelimit-Reset`; quota do YouTube inalterada | `/api/lives` com YouTube e Twitch falsos: lista junta; Twitch fora do ar → parcial; as duas fora → erro | — |
| #42 | Ao vivo → `live` com viewers; lista vazia → `ended`; nome de canal inválido → nenhuma chamada; cache de 60 s | `/api/status/twitch/<canal>`: 200, 400, e plataforma inativa → 400 | — |
| #43 | `tests/security-headers.test.ts`: `static-cdn.jtvnw.net` em `img-src`, `player.twitch.tv` em `frame-src`, sem curingas, origens do YouTube iguais | — | Nenhuma violação de CSP com miniatura e player da Twitch simulados |
| #44 | URL do iframe com `channel`, `parent=<hostname>`, `autoplay=false` e `muted=true` | — | Abrir o player da Twitch (iframe e miniatura simulados com `page.route`, como já se faz com o YouTube); live encerrada → sem iframe, com link; foco preso, `Esc` fecha e o foco volta ao card |
| #45 | `tests/policy-acceptance.test.ts`: nova `updatedAt` mostra o aviso de novo | — | **Nenhuma requisição a domínios da Twitch antes do aceite** (verificar com `page.on("request")`) |
| #46 | `formatPlatformList` com 1, 2 e 3 plataformas; `tests/seo.test.ts` com 1 e 2 plataformas | — | Textos da home com 1 e com 2 plataformas |

**Fase 3 — Kick:** mesma matriz da Twitch (#48 → #39, #49 → #40 e assim por diante), com a fixture real do #31.

### 5.4 Casos de falha obrigatórios para cada provedor externo

Cada um precisa de teste no serviço ou no cliente:

- [ ] Timeout
- [ ] `401` e `403`
- [ ] `429` com e sem cabeçalho de espera
- [ ] `5xx`
- [ ] JSON malformado
- [ ] Resposta válida com lista vazia
- [ ] Campos obrigatórios faltando
- [ ] Cache vencido disponível (`stale`) e cache vazio
- [ ] Provedor ligado sem credenciais
- [ ] Duas requisições simultâneas (single-flight)

### 5.5 Testes de segurança

- [ ] **Segredos fora dos logs:** os testes do cliente, do serviço e da telemetria espionam `logEvent` e falham se aparecer o secret, o token, a URL completa ou um IP.
- [ ] **Segredos só no servidor:** os módulos `lib/twitch/*` e `lib/kick/*` com credenciais usam `import "server-only"`. Nenhuma variável nova tem o prefixo `NEXT_PUBLIC_`.
- [ ] **Bundle do cliente limpo:** novo passo no CI depois do build, em `.github/workflows/ci.yml`, incluído na #39:
  ```bash
  ! grep -rE "id\.twitch\.tv/oauth2|TWITCH_CLIENT_SECRET|id\.kick\.com/oauth" .next/static
  ```
- [ ] **CSP:** só as origens exatas entram, sem curingas. O e2e falha em qualquer violação, e isso já acontece hoje.

### 5.6 Smoke test pós-deploy

Rode em Preview e em produção depois de cada ativação.

```bash
# Dados reais: sources e plataformas presentes
curl -s https://<deploy>/api/lives | jq '{sources, total: (.items|length), plataformas: ([.items[].platform]|unique)}'

# Status de um canal da Twitch tirado da lista
curl -s https://<deploy>/api/status/twitch/<canal> | jq

# Interface no deploy, com a API simulada (sem quota)
E2E_BASE_URL=https://<deploy> npm run test:e2e
```

Resultado esperado em produção:
- `sources` tem `youtube` e `twitch` com `ok: true`;
- `plataformas` inclui `twitch`;
- o status de um canal da lista devolve `"live"`.

Observação: o Preview não tem `YOUTUBE_API_KEY`. Lá, o esperado é `youtube` com `ok: false` e a Twitch funcionando. Isso já testa o resultado parcial com dados reais.

### 5.7 QA manual (#56)

O roteiro segue a spec 015 e acrescenta:

- **Estados:** resultado parcial; Twitch fora do ar.
- **Filtros:** plataforma combinada com idioma e ordenação.
- **Player da Twitch:** live real, live encerrada, link de fallback.
- **Conteúdo adulto:** selo "Conteúdo adulto".
- **Acessibilidade:** leitor de tela (NVDA no Windows) e teclado.
- **Exibição:** 360 px e desktop, nos temas claro e escuro, com `prefers-reduced-motion`.

---

## 6. Rollback

| Situação | Ação | Tempo |
|---|---|---|
| A Twitch causa erro ou comportamento estranho | No painel da Vercel, tirar `twitch` de `LIVES_PROVIDERS` em Production e fazer redeploy | Minutos |
| O player da Twitch falha | Marcar a Twitch como "sem embed" em `lib/lives/platforms.ts`. O card passa a só abrir o link. | Um PR pequeno |
| Regressão da Fase 1 no YouTube | Reverter o PR da issue responsável. Cada issue é um PR. | Um PR de revert |
| Credencial vazada | Revogar o secret no console da Twitch, gerar outro e atualizar no painel da Vercel | Minutos |

**Ensaio obrigatório na onda 3:** depois de ativar em produção, desligue a Twitch uma vez e confirme que a home volta só ao YouTube sem erro. Depois religue.

---

## 7. Tarefas que só você pode fazer

- [ ] Responder ou aprovar D1 a D9 na #32.
- [ ] Fazer a chamada real à API da Twitch durante o #30 (as credenciais são suas e não passam pelo agente).
- [ ] Criar o app no console da Twitch e cadastrar as variáveis no painel da Vercel (#47).
- [ ] Aprovar os textos de `/privacy` e `/terms` (#45) e os registros de LGPD atualizados.
- [ ] Autorizar cada push e cada PR. Pela regra 8 do `sprint.md`, o agente só faz push com a sua autorização.
- [ ] Decidir se segue com a Kick depois do #31.

---

## 8. Estimativa

Unidades: P = meio dia, M = 1,5 dia, G = 2,5 dias de trabalho de agente. Não inclui o tempo das suas revisões.

| Onda | Issues | Esforço sequencial |
|---|---|---|
| 0 | #30, #31, #32 | ~2,5 dias (os spikes rodam em paralelo) |
| 1 | #33 a #38 | ~9 dias (~7 com #37 e #38 em paralelo) |
| 2 | #39 a #46 | ~8 dias (~6 com #43, #45 e #46 em paralelo) |
| 3 e 4 | #47, #56, #57 | ~2 dias + 48 h de monitoramento |
| **Twitch no ar** | | **~3 a 4 semanas** |
| 6 (Kick) | #48 a #55 | +~6 dias, se aprovada |

---

## 9. Riscos principais

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Regressão no YouTube durante a Fase 1 | Média | Teste de caracterização, e2e e um PR por issue |
| Gasto extra de quota do YouTube no deploy do agregador | Média | Manter a chave de cache `lives` (#34) e acompanhar 24 h (portão G1) |
| Categoria de GTA 6 mudar de id na Twitch | Baixa | `TWITCH_GAME_ID` é configurável |
| `parent` errado deixa o player da Twitch em branco | Média | `parent` vem de `window.location.hostname`; testado em Preview |
| Aviso de aceite reaparecendo surpreende os usuários | Certa (é esperado) | Fazer junto com a ativação e anunciar, se quiser |
| API da Kick instável ou bloqueando a Vercel | Média | A Kick fica isolada na onda 6, atrás do #31 |
