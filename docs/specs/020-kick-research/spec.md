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

## Inferências (não confirmadas)

- **I1:** como o v2 ordena das lives mais antigas para as mais novas, a "relevância" precisa ser calculada por nós. **Proposta:** ordenar por `viewer_count` decrescente e usar essa posição como `rank`.
- **I2:** a categoria de GTA 6 deve ter bem menos de 1000 lives ao mesmo tempo. Se for assim, **uma chamada** com `limit=1000` traz todas, sem paginar. A pendência P2 confirma.
- **I3:** o `slug` do canal deve coincidir com o usuário usado em `player.kick.com/<usuário>` e em `kick.com/<slug>`. A pendência P2 confirma.
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
| `language_code` (BCP 47) | `language` | Prefixo `pt`, `en` ou `es`; o resto vira `unknown` (D7) |
| `https://kick.com/<slug>` | `watchUrl` | |
| `https://player.kick.com/<slug>?autoplay=false&muted=true` | `embedUrl` | D3 |
| — | `isLive` | `true` (o endpoint só devolve lives ativas) |
| — | `embedAllowed` | `true` |
| posição depois de ordenar por `viewer_count` | `rank` | I1 |
| `has_mature_content` | `isMature` | D6: aparece com o selo |

## Impacto nas issues da Fase 3

| Issue | Ajuste |
|---|---|
| #48 cliente | Token em `id.kick.com/oauth/token`, com corpo form-urlencoded. Sem refresh token: pedir outro token quando o atual vencer. |
| #49 busca | Usar **v2** (não v1); `limit=1000`; ordenar por `viewer_count` no nosso código (I1); filtro de idioma `language_code=pt&language_code=en&language_code=es`. |
| #50 serviço | Sem rate limit documentado: TTL de cache conservador (sugestão: 120 s), backoff em `429` e `5xx`. |
| #51 status | Usar `GET /public/v1/users/livestreams?user_id=<broadcaster_user.id>`. A rota `/api/status/kick/[id]` recebe o **id numérico**, não o `slug`. **Isso também afeta #36:** o id da rota de status pode ser diferente de `sourceId`. |
| #52 CSP | `frame-src https://player.kick.com`. `img-src` depende do domínio de P2. |
| #53 player | `https://player.kick.com/<slug>?autoplay=false&muted=true`. Sem `parent`, porque não há restrição de domínio documentada. |
| #54 legal | Depende de P4. |

## Recomendação

**Seguir com ressalvas, por enquanto.** A API oficial cobre tudo que precisamos (token de app, lives por categoria e idioma, viewers, status por usuário e player embutido), com um contrato bem definido em OpenAPI.

As ressalvas:
1. **Ordenação:** a ordem por espectadores é calculada por nós.
2. **API recente e em mudança:** exige validação Zod e atenção ao changelog.
3. **Pendências:** P3 (bloqueio em datacenter) e P4 (termos) podem mudar a recomendação para **adiar**.

A decisão final de seguir (portão da onda 6 no plano) fica para depois de P1 a P4.

## Critérios de aceite do spike

1. **CA1:** cada pergunta da #31 tem resposta com fonte, ou aparece como pendência com responsável. ✅
2. **CA2:** o resultado do teste a partir da Vercel está registrado. ⏳ P3
3. **CA3:** a tabela de mapeamento Kick → `LiveItem` existe. ✅
4. **CA4:** há recomendação com motivo. ✅ (provisória até P1 a P4)
