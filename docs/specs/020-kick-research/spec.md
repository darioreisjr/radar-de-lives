# 020 — Spike: API pública da Kick para lives de GTA 6

Issue [#31](https://github.com/darioreisjr/radar-de-lives/issues/31) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Branch `sprint/020-kick-research`

## Contexto

A Kick tem uma API pública oficial desde 2025. Antes de investir nas issues #48 a #55, o projeto precisa saber três coisas: se dá para listar lives de GTA 6 de forma confiável a partir do servidor da Vercel, quais campos vêm na resposta e o que os termos permitem.

Pela skill SDD, **não inventamos comportamento de serviço externo**. Por isso este documento separa:
- **fatos confirmados**, cada um com a fonte;
- **inferências**;
- **pendências**, que precisam de credenciais ou de um deploy.

## Fontes consultadas em 2026-11-25

| Sigla | Fonte |
|---|---|
| F1 | Repositório oficial da documentação: [KickEngineering/KickDevDocs](https://github.com/KickEngineering/KickDevDocs) (origem do docs.kick.com; último push em 2026-10-05) |
| F2 | Especificação OpenAPI oficial: `https://api.kick.com/swagger/doc.yaml` ("Kick Dev Public API", versão 1.0.0), referenciada pelas páginas de API de F1 |
| F3 | [Changelog oficial](https://github.com/KickEngineering/KickDevDocs/blob/main/changelog.md) |
| F4 | [OAuth 2.1](https://github.com/KickEngineering/KickDevDocs/blob/main/getting-started/generating-tokens-oauth2-flow.md) e [App Setup](https://github.com/KickEngineering/KickDevDocs/blob/main/getting-started/kick-apps-setup.md) |
| F5 | Central de ajuda: [How to embed your Kick livestream](https://help.kick.com/en/articles/8010826-how-to-embed-your-kick-livestream) |
| F6 | Requisições de teste feitas a partir de uma máquina local (Brasil), sem credenciais |

## Fatos confirmados

### Autenticação (F2, F4)

- O app access token vem do fluxo **Client Credentials**:
  ```
  POST https://id.kick.com/oauth/token
  Content-Type: application/x-www-form-urlencoded
  grant_type=client_credentials&client_id=…&client_secret=…
  ```
- A resposta tem `access_token`, `token_type` e `expires_in`. Para o app token **não existe refresh token**: quando ele vence, pede-se outro.
- O app token "acessa dados públicos", o que basta para listar lives. Não precisa de login do usuário.
- O servidor de OAuth (`id.kick.com`) é diferente do servidor da API (`api.kick.com`).
- Para criar um app, é preciso ativar **2FA** na conta da Kick e ir em **Settings → Developer** (`https://kick.com/settings/developer`).

### Busca de lives (F2, F3)

- **Endpoint vigente:** `GET https://api.kick.com/public/v2/livestreams`.
  - Lançado em 23/06/2026.
  - O v1 está **obsoleto**. Em 03/07/2026 o changelog diz que o v1 "should now be completely migrated off".
- **Parâmetros:**

  | Nome | Tipo | Regra |
  |---|---|---|
  | `category_id` | array de int64 | Até 25 |
  | `language_code` | array de strings BCP 47 | Até 25 |
  | `limit` | int | Padrão 100, mínimo 1, **máximo 1000** |
  | `cursor` | string | Paginação |

- ⚠️ **Ordenação:** a especificação diz *"Livestreams are sorted from oldest to newest."* O v2 **não tem** o parâmetro `sort`; o v1 obsoleto tinha `sort=viewer_count`.
- **Resposta:** `{ data: LivestreamV2[], message: string, pagination: { next_cursor: string } }`.
- **Autorização aceita:** `AppAccessToken` ou `UserAccessToken`.
- **Erros documentados:** `400`, `401` e `500`, no formato `{ message, data, pagination }`. **Não há `429` documentado** para este endpoint; ele só aparece em ads e chat.

### Campos do `LivestreamV2` (F2; todos marcados como obrigatórios)

| Campo | Tipo | Exemplo da especificação |
|---|---|---|
| `id` | string uuid | `123e4567-…` |
| `title` | string | |
| `started_at` | string (data e hora) | `2022-01-15T03:00:00Z` |
| `viewer_count` | int | `100` |
| `language_code` | string | `en` |
| `has_mature_content` | boolean | |
| `tags` | string[] | |
| `thumbnail` | string (URL) | |
| `broadcaster_user` | `{ id: int, username: string, profile_picture: string }` | |
| `channel` | `{ slug: string }` | `streamer-123` |
| `category` | `{ id: int, name: string, thumbnail: string }` | |

### Status de uma live específica (F2, F3)

- `GET /public/v1/users/livestreams?user_id=<id>` aceita até 100 ids e devolve `data: LivestreamV2[]` com as lives **ativas** desses usuários. Foi lançado em 03/07/2026.
- A consulta é pelo **id numérico do usuário** (`broadcaster_user.id`), não pelo `slug`.

### Categorias (F2, F3)

- `GET /public/v2/categories?name=<nome>`, com filtros `name`, `tag` e `id` e paginação por cursor. O v1 está obsoleto desde 15/01/2026.
- Resposta: `{ id, name, tags, thumbnail }`.

### Player embutido (F5)

- URL: `https://player.kick.com/<usuário>`.
- Parâmetros:

  | Parâmetro | Padrão | Observação |
  |---|---|---|
  | `autoplay` | `false` | |
  | `muted` | `false` | |
  | `allowfullscreen` | ligado | Para desligar, também é preciso tirar o atributo do iframe |

- O artigo **não cita** restrição de domínio, atribuição ou tamanho mínimo. 1280×720 aparece só como exemplo.
- F6: `https://player.kick.com/<canal>` respondeu `200` **sem** `X-Frame-Options` e sem `frame-ancestors`. Nada nos cabeçalhos impede o embed.

### Rede (F6)

- `GET https://api.kick.com/public/v2/livestreams?limit=1` sem token respondeu `401` com `Content-Type: application/json`, em 0,9 s.
- Há Cloudflare na frente (`Server: cloudflare`), mas o retorno veio da API, sem desafio anti-bot.
- O teste foi feito de um IP residencial no Brasil, **não** de um datacenter.

### Estabilidade (F1, F3)

- O README chama esta fase de "get feedback and iterate quickly".
- O changelog mostra mudanças frequentes. Em 12 meses:
  - Livestreams foi do v1 para o v2;
  - Categories foi do v1 para o v2;
  - o endpoint de introspecção de token mudou de lugar.
- **Conclusão:** a API está ativa, mas os contratos mudam. É preciso validação forte na fronteira (Zod) e acompanhar o changelog.

## Resultados com o app criado (P1, P2, P4), 2026-11-27

Obtidos pelo responsável, de um IP residencial no Brasil, com o token de app. Nenhuma credencial foi compartilhada.

### P1 — categoria

- `GET /public/v2/categories?name=Grand Theft Auto VI` → **`13155`**, nome `Grand Theft Auto VI (GTA)`.

### P2 — resposta real

| Item | Resultado |
|---|---|
| Token de app | Aceito; `expires_in` = **5184000** (60 dias). |
| Volume | **1815 lives** na categoria, em **2 páginas** de `limit=1000` (cursor em `pagination.next_cursor`), em ~4 s no total. |
| Ordem | Da mais antiga para a mais nova, como diz a especificação: as primeiras tinham 7, 2 e 2 espectadores. |
| Público | 236 com 0 espectadores; 357 com ≥ 10; 117 com ≥ 100; 24 com ≥ 1000. Maior: 26.508 (`ar`). |
| Idiomas (`language_code`) | en 1016, es 422, pt 119, **en-IN 64**, tr 31, ar 27, outros. Há variantes regionais (BCP 47). |
| `has_mature_content` | **1781 de 1815 (98%)** `true`. |
| Miniaturas (`thumbnail`) | `https://images.kick.com/...` e `https://web.kick.com/...` (`.webp`). Foto de perfil e capa da categoria em `files.kick.com` (não usadas no card). |
| `channel.slug` | Igual ao `broadcaster_user.username` em minúsculas (ex.: `itsfrostysinn`). |
| Campos | Todos os do `LivestreamV2` documentado, com os mesmos nomes. |

- A fixture `tests/fixtures/kick/livestreams-v2.json` tem 3 itens no formato real, **anonimizados** (ids, slugs, usuários e caminhos trocados). `message` e o `next_cursor` vazio da última página são suposições: a resposta real não foi impressa inteira.
- O filtro `language_code=pt&language_code=en&language_code=es` da própria API não teve o resultado registrado. Como a busca completa custa 2 chamadas, o filtro de idioma pode ser feito no nosso código.

### P4 — Developer Terms ([dev.kick.com/terms-of-service](https://dev.kick.com/terms-of-service), sem data de versão na página; lido em 2026-11-27)

Trechos literais relevantes (o restante não muda o projeto):

| Tema | Texto | Consequência para o site |
|---|---|---|
| Cache (Schedule 1, C) | "Do not store copies of Kick Content or Program Materials, unless you: … (c) cache such information for only a twenty-four hour time period without further sharing it with third parties." | Cache de minutos permitido. |
| Atualização (6; Schedule 1, C) | "You must update Program Materials used in Your Services frequently"; "delete Program Materials and Kick Content when Kick reports them as deleted or expired". | TTL curto; revalidar a live antes do player. |
| Re-distribuição (Schedule 1, C) | "Re-syndication and re-distribution of Program Materials or data as available from a Kick API is prohibited." | Exibir no próprio site é o uso previsto (seção 6). O `/api/lives` deve ser tratado e documentado como uso interno do site, com o rate limit atual. |
| Atribuição (3.1, 6) | "Use and display Kick Marks solely to attribute Kick's offerings as the source"; "there is a clear path to the source". | Selo de texto "Kick" e link "Abrir na Kick". Não usar logo. |
| Player (Schedule 1, D) | "You must adopt and integrate our embeddable player for all Kick video content." "Do not modify, replace, interfere with, limit, block, cover, or obscure: (a) the functionality of embeddable experiences, including advertisements; or (b) the Kick Marks." | Só o player oficial, sem nada por cima. |
| Sites proibidos para embed (Schedule 1, D.1) | "(a) have a primary purpose to share or host content that would violate Kick's Terms of Service or Community Guidelines; (b) attempt to replicate the Kick experience without offering additional content or data of substantial value on the same page; or (c) target children under 16." | O site agrega valor (várias plataformas, filtros, radar). **A #54 deve deixar claro que o site não é voltado a menores de 16.** |
| Valor (3.5) | "The App must be designed to provide meaningful and demonstrable value to Kick Streamers and/or viewers." | A Kick pode revogar o app; desligar a plataforma leva ~1 min. |
| Dados e comércio (5.2; Schedule 1, B) | Proíbe vender, licenciar, monetizar ou compartilhar os dados, e usar para segmentar anúncios. | O site não faz nada disso. |
| Privacidade (Schedule 1, A) | Política de privacidade pública; "set persistent cookies to expire within 13 months". | Já atendido; a #54 inclui a Kick em `/privacy`. |
| Mudanças e término (3.6, 7, 8.2) | A Kick pode mudar os termos e revogar chaves "for any reason or no reason at all". | Mesmo risco aceito para a Twitch. |

Não lidos: Community Guidelines, Privacy Policy e Advertising Policy da Kick. Não é análise jurídica: entra na revisão jurídica (S-01).

### P3 — teste a partir de um datacenter (Vercel Preview, 2026-11-27)

Branch descartável `spike/kick-network` (rota `/api/spike-kick` e página `/spike-kick`), com `KICK_CLIENT_ID` e `KICK_CLIENT_SECRET` só em Preview. Resultado:

| Etapa | Resultado |
|---|---|
| Região | `iad1` (a mesma das funções de produção) |
| Token (`id.kick.com/oauth/token`) | `200` em 159 ms, JSON, via Cloudflare, `expires_in` 5184000 |
| Página 1 (`limit=1000`) | `200` em 289 ms, 1000 lives |
| Página 2 (cursor) | `200` em 744 ms, 699 lives |
| Total | **1699 lives**; nenhum bloqueio nem desafio do Cloudflare |
| Maiores em pt/en/es | 9729 (en), 6957 (en), 6891 (es) |
| Player embutido | `player.kick.com/<slug>?autoplay=false&muted=true` carregou no iframe com a CSP liberando `player.kick.com`, mostrando o canal, a categoria e "LIVE · 9.7K watching", **sem tela de idade ou login** (ao contrário da Twitch) |

**I3 confirmada:** o `slug` abre o player. A branch, os Previews dela e as variáveis foram removidos depois do teste.

### Decisão do responsável (2026-11-27)

| ID | Decisão | Motivo |
|---|---|---|
| D-K1 | **Sem o selo "Conteúdo adulto" na Kick.** `isMature` = `false` para itens da Kick. | `has_mature_content` vem `true` em 98% da categoria: equivale ao rótulo do jogo (`MatureGame` na Twitch), que o PRD D6 já não conta. |

## Inferências (não confirmadas)

- **I1:** como o v2 ordena das lives mais antigas para as mais novas, a "relevância" precisa ser calculada por nós. **Proposta:** ordenar por `viewer_count` decrescente e usar essa posição como `rank`.
- **I2 (refutada por P2):** eram 1815 lives, em 2 páginas. A busca precisa seguir o cursor (com um teto de páginas) antes de ordenar.
- **I3 (confirmada por P2):** `channel.slug` = `broadcaster_user.username` em minúsculas. Falta ver o player abrir (P3).
- **I4:** a falta de `429` documentado **não** quer dizer que não existe limite. O cliente deve tratar `429` com backoff e cache.

## Pendências

Elas dependem de credenciais da Kick ou de um deploy de Preview:

| # | Pendência | Como resolver | Quem |
|---|---|---|---|
| P1 | `category_id` de GTA 6 | `GET /public/v2/categories?name=Grand Theft Auto VI` | Você, com o app criado |
| P2 | Resposta real: volume de lives (I2), `slug` igual ao usuário (I3), **domínio do CDN das miniaturas** (necessário para a CSP), valor real de `expires_in` | `GET /public/v2/livestreams?category_id=<P1>&limit=1000` | Você |
| P3 | Teste a partir de um **datacenter** (função da Vercel), para descartar bloqueio do Cloudflare | Rota temporária num Preview, numa branch que não vai para `main` | Agente prepara; você autoriza o deploy e cadastra as credenciais só em Preview |
| P4 | Texto dos **Developer Terms and Conditions** da Kick: cache, atribuição, uso do nome e conteúdo adulto | O App Setup cita esses termos, mas não tem link; `kick.com/developer-terms` dá 404. O texto deve aparecer ao criar o app em Settings → Developer. | Você copia o link ou o texto |

## Mapeamento Kick → `LiveItem`

| Kick | `LiveItem` | Observação |
|---|---|---|
| `channel.slug` | `sourceId` | Usado no link e no player |
| — | `id` | `kick:<slug>` |
| `title` | `title` | |
| — | `description` | `""` (a Kick não tem descrição) |
| `broadcaster_user.id` | `channelId` | Usado na revalidação de status |
| `broadcaster_user.username` | `channelTitle` | |
| `thumbnail` | `thumbnailUrl` | Validar HTTPS e o domínio de P2 |
| `started_at` | `liveStartedAt` e `publishedAt` | |
| `viewer_count` | `concurrentViewers` | Obrigatório na especificação; se faltar, `null` |
| `language_code` (BCP 47) | `language` | Prefixo `pt`, `en` ou `es` (inclui `en-IN` e afins); o resto vira `unknown` (D7) |
| `https://kick.com/<slug>` | `watchUrl` | |
| `https://player.kick.com/<slug>?autoplay=false&muted=true` | `embedUrl` | D3 |
| — | `isLive` | `true` (o endpoint só devolve lives ativas) |
| — | `embedAllowed` | `true` |
| posição depois de ordenar por `viewer_count` | `rank` | I1 |
| `has_mature_content` | `isMature` | **Ignorado: sempre `false`** (D-K1) |

## Impacto nas issues da Fase 3

| Issue | Ajuste |
|---|---|
| #48 cliente | Token em `id.kick.com/oauth/token`, com corpo form-urlencoded. Sem refresh token: pedir outro token quando o atual vencer. |
| #49 busca | Usar **v2**; `category_id=13155`; `limit=1000`; **seguir `next_cursor`** (teto sugerido: 5 páginas); filtrar pt/en/es pelo prefixo do idioma; ordenar por `viewer_count` (I1) e ficar com as **100 maiores**, como na Twitch. |
| #50 serviço | Sem rate limit documentado: TTL de cache conservador (sugestão: 180 s, como a Twitch), backoff em `429` e `5xx`. Token de 60 dias em memória. |
| #51 status | Usar `GET /public/v1/users/livestreams?user_id=<broadcaster_user.id>`. A rota `/api/status/kick/[id]` recebe o **id numérico**, não o `slug`. **Isso também afeta #36:** o id da rota de status pode ser diferente de `sourceId`. |
| #52 CSP | `frame-src https://player.kick.com`; `img-src https://images.kick.com https://web.kick.com` (P2). |
| #53 player | `https://player.kick.com/<slug>?autoplay=false&muted=true`. Sem `parent`. No P3, o player carregou sem pedir login: sem aviso como o da spec 044. |
| #54 legal | Termos da Kick (P4): atribuição, re-distribuição, **site não voltado a menores de 16**, privacidade. |

## Recomendação

**Seguir com ressalvas — recomendação final** (2026-11-27, com P1 a P4). A API oficial cobre tudo que precisamos (token de app, lives por categoria e idioma, viewers, status por usuário e player embutido), com um contrato bem definido em OpenAPI.

As ressalvas:
1. **Ordenação:** a ordem por espectadores é calculada por nós.
2. **API recente e em mudança:** exige validação Zod e atenção ao changelog.
3. **Volume e ordem:** 1815 lives em 2 páginas, da mais antiga para a mais nova; é preciso paginar e cortar nas 100 maiores.
4. **Termos:** atendíveis (P4), com o cuidado de re-distribuição e da idade mínima de 16 anos.
5. **P3 sem bloqueio:** a API responde da Vercel (`iad1`) em ~1,2 s para as 2 páginas, e o player embute sem pedir login.

A decisão final de seguir (portão da onda 6 no plano) fica para depois de P1 a P4.

## Critérios de aceite do spike

1. **CA1:** cada pergunta da #31 tem resposta com fonte, ou aparece como pendência com responsável. ✅
2. **CA2:** o resultado do teste a partir da Vercel está registrado. ✅ P3
3. **CA3:** a tabela de mapeamento Kick → `LiveItem` existe. ✅
4. **CA4:** há recomendação com motivo. ✅ (final)
