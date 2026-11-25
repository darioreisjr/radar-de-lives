# 019 — Spike: API Helix da Twitch para lives de GTA 6

Issue [#30](https://github.com/darioreisjr/radar-de-lives/issues/30) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Branch `sprint/019-twitch-research`

## Contexto

Antes de escrever o código da Twitch (issues #39 a #47), o projeto precisa de **fatos confirmados** na documentação oficial e numa chamada real. Pela skill SDD, este documento separa:
- **fatos confirmados**, cada um com a fonte;
- **inferências**;
- **pendências**.

## Fontes consultadas em 2026-11-25

| Sigla | Fonte |
|---|---|
| F1 | [API Reference — Streams (Get Streams)](https://dev.twitch.tv/docs/api/reference/streams) |
| F2 | [Getting OAuth Access Tokens — Client credentials grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow) |
| F3 | [API Guide — Twitch Rate Limits](https://dev.twitch.tv/docs/api/guide/#twitch-rate-limits) |
| F4 | [Embed — Video & Clips](https://dev.twitch.tv/docs/embed/video-and-clips/) |
| F5 | [Twitch Developer Services Agreement](https://legal.twitch.com/en/legal/developer-agreement/). **O texto não pôde ser lido por automação** (ver P1). |
| F6 | Chamadas reais feitas pelo responsável em 2026-11-25, por volta das 8h de Brasília, com um app próprio de testes |

## Fatos confirmados

### Autenticação (F2, F6)

- Token de app:
  ```
  POST https://id.twitch.tv/oauth2/token
  Content-Type: application/x-www-form-urlencoded
  client_id=…&client_secret=…&grant_type=client_credentials
  ```
- A resposta tem `access_token`, `expires_in` e `token_type: "bearer"`. **Não há refresh token**: quando o token vence, pede-se outro. O exemplo oficial mostra `expires_in: 5011271` (cerca de 58 dias).
- As chamadas à Helix levam os cabeçalhos `Client-Id: <client_id>` e `Authorization: Bearer <token>` (F6).
- F2 diz que apps que mantêm uma sessão OAuth "**must** call the `/validate` endpoint to verify that the access token is still valid".

### Categoria de GTA 6 (F6)

- `GET https://api.twitch.tv/helix/games?name=Grand Theft Auto VI` devolve:
  - `id`: **`1867279146`**
  - `name`: "Grand Theft Auto VI"
  - `igdb_id`: `52189`
  - capa em `static-cdn.jtvnw.net/ttv-boxart/…`

### Busca: `GET https://api.twitch.tv/helix/streams` (F1)

- **Parâmetros:**

  | Nome | Regra |
  |---|---|
  | `game_id` | Até 100 |
  | `language` | ISO 639-1 ou `other`; até 100; repetível, ex.: `language=pt&language=en` |
  | `type` | `all` (padrão) ou `live` |
  | `first` | 1 a **100**, padrão 20 |
  | `after` e `before` | Cursores; usar um ou outro, não os dois |
  | `user_id` e `user_login` | Até 100; com eles, a resposta traz todos os streams correspondentes, ignorando `first` |

- **Ordenação:** *"The list is in descending order by the number of viewers watching the stream."* F6 confirmou: `True`.
- **Página com menos itens:** *"a page may contain fewer than first items even if more pages remain"*. F6 confirmou: veio 99 com `first=100`.
- **Paginação:** a documentação avisa que pode haver **duplicatas ou lacunas** entre páginas, porque a ordem muda enquanto se pagina.
- **Erros:** `400` (parâmetro inválido) e `401` (token ausente ou inválido, ou `Client-Id` que não corresponde ao token).
- **Campos de `data[]`:** `id`, `user_id`, `user_login`, `user_name`, `game_id`, `game_name`, `type`, `title`, `tags` (pode ser `null`), `viewer_count`, `started_at`, `language`, `thumbnail_url`, `tag_ids`, `is_mature`. Também vem `pagination.cursor`.
- ⚠️ **`tag_ids` está obsoleto** desde 28/02/2023 e sempre volta vazio.
- ⚠️ **`is_mature` está obsoleto e sempre volta `false`** (F1). F6 confirmou: 0 de 99.
- **Miniatura:** `https://static-cdn.jtvnw.net/previews-ttv/live_user_<login>-{width}x{height}.jpg`. É preciso trocar `{width}x{height}` pelo tamanho desejado (F6).

### Volume observado (F6, 2026-11-25, de manhã no Brasil)

- `language=pt`: **96** lives na 1ª página, **com** próxima página. Logo, há mais de 100 lives em português.
- Todas as línguas: 99 na 1ª página, com próxima página. Principais idiomas: en 40, ru 18, fr 11, zh 7, it 5, es 4, de 3, hu 3.

### Limite de requisições (F3, F6)

- É um balde de pontos **por client id**, um para app token e outro para user token. Cada endpoint custa 1 ponto, salvo indicação.
- F6: `Ratelimit-Limit: 800`.
- `Ratelimit-Reset` é um timestamp Unix em segundos de quando o balde volta a encher.
- Em `429`: esperar até `Ratelimit-Reset`. Algumas respostas `429` não vêm do balde, então é preciso ler a mensagem de erro.
- Em `503`: tentar de novo uma vez.

### Player embutido (F4)

- URL: `https://player.twitch.tv/?channel=<login>&parent=<domínio>`.
- **`parent` é obrigatório**, com um `parent` para cada domínio onde o site roda. Pode ser repetido.
- `autoplay`: padrão `true`. `muted`: padrão `false`.
- ⚠️ **Tamanho mínimo: 400×300 px** ("Embedded video windows must be at least 400x300 pixels").
- A documentação **não diz** se `localhost` é aceito, se HTTPS é exigido ou se porta e protocolo podem ir no `parent`.

## Inferências (não confirmadas)

- **I1:** como `is_mature` sempre volta `false`, a única forma de cumprir a decisão D6 na Twitch é o campo `content_classification_labels` de `GET /helix/channels?broadcaster_id=…` (até 100 ids por chamada). Isso custa **1 chamada extra por atualização**. Confirmar o nome e o formato do campo na referência de Channels antes de #40.
- **I2:** buscar `language=pt&language=en&language=es` com até 3 páginas de 100 (3 pontos dos 800 por minuto) deve cobrir quase todas as lives relevantes. Depois, deduplicar por `id`, por causa das duplicatas entre páginas.
- **I3:** o `parent` igual a `window.location.hostname` deve funcionar em produção, Preview e `localhost`. Confirmar em Preview na #44.

## Pendências

| # | Pendência | Quem |
|---|---|---|
| P1 | **Ler o Developer Services Agreement** (F5) e anotar as cláusulas sobre cache e armazenamento de dados, exibição e atribuição, uso do nome e das marcas, exigência de política de privacidade e conteúdo adulto. A página só carrega no navegador. | Você (o agente resume o que você colar) |
| P2 | Confirmar `content_classification_labels` em Get Channel Information (I1) | Agente, na #40 |
| P3 | Validar `parent` e tamanho mínimo num Preview | Agente, na #44 |

## Mapeamento Twitch → `LiveItem`

| Twitch | `LiveItem` | Observação |
|---|---|---|
| `user_login` | `sourceId` | Usado no link, no player e no status (`user_login` é aceito em Get Streams) |
| — | `id` | `twitch:<user_login>` |
| `title` | `title` | |
| — | `description` | `""` |
| `user_id` | `channelId` | |
| `user_name` | `channelTitle` | |
| `thumbnail_url` com `{width}x{height}` → `640x360` | `thumbnailUrl` | Domínio `static-cdn.jtvnw.net` |
| `started_at` | `liveStartedAt` e `publishedAt` | |
| `viewer_count` | `concurrentViewers` | Sempre presente |
| `language` (ISO 639-1) | `language` | `pt`, `en`, `es`; o resto vira `unknown` (D7) |
| `https://www.twitch.tv/<user_login>` | `watchUrl` | |
| `https://player.twitch.tv/?channel=<login>&parent=<hostname>&autoplay=false&muted=true` | `embedUrl` | `parent` definido no cliente (#37) |
| — | `isLive` | `true` |
| — | `embedAllowed` | `true` |
| posição na resposta (já vem por viewers) | `rank` | Depois de juntar páginas e deduplicar |
| ~~`is_mature`~~ → `content_classification_labels` (I1) | `isMature` | `is_mature` é inútil |

## Impacto nas issues

| Issue | Ajuste |
|---|---|
| #32 PRD / D6 | Para a Twitch, o selo "Conteúdo adulto" usa 1 chamada extra a `/helix/channels` (I1). **Decidido em 2026-11-25: aceitar a chamada extra.** |
| #39 cliente | Token em `id.twitch.tv/oauth2/token`. Validar com `/validate` ao iniciar e a cada hora, conforme F2. Em `401`, pedir um token novo e repetir uma vez. |
| #40 busca | `language` repetido para pt, en e es; até 3 páginas; deduplicar por `id`; ignorar `tag_ids` e `is_mature`; `tags` pode ser `null`. Configurar `TWITCH_GAME_ID=1867279146`. |
| #41 serviço | Ler `Ratelimit-Remaining` e `Ratelimit-Reset`; em `429`, esperar até o reset; em `503`, tentar de novo uma vez. |
| #42 status | `GET /helix/streams?user_login=<login>`; lista vazia significa offline. |
| #43 CSP | `img-src https://static-cdn.jtvnw.net`; `frame-src https://player.twitch.tv`. |
| #44 player | `parent` obrigatório. **Com menos de 400 px de largura** (o perfil `mobile-375` do e2e), o player não atinge o mínimo: mostrar só o link "Assistir na Twitch". Passar `autoplay=false` explicitamente, porque o padrão é `true`. |
| #45 legal | Depende de P1. |

## Recomendação

**Seguir.** A API é estável e documentada, já ordena por espectadores, tem limite folgado (800 por minuto contra uns 3 a 4 pontos por atualização) e tem lives de GTA 6 em português em volume alto.

Pontos de atenção:
- **D6:** o selo adulto custa 1 chamada extra (I1).
- **Celular estreito:** abaixo de 400 px, só o link.
- **Termos:** P1 precisa ser lido antes da #45.

## Critérios de aceite do spike

1. **CA1:** cada item da #30 tem resposta com fonte, ou aparece como pendência com responsável. ✅
2. **CA2:** o `game_id` de GTA 6 está registrado com data: `1867279146`, em 2026-11-25. ✅
3. **CA3:** a tabela de mapeamento existe, indicando os campos opcionais ou obsoletos. ✅
4. **CA4:** as exigências do Developer Agreement estão listadas. ⏳ P1
5. **CA5:** há recomendação: **seguir**. ✅
