# Radar de Lives

Diretório independente para encontrar transmissões **públicas** de GTA 6 que estejam ao vivo no **YouTube** e na **Twitch**.
Mostra **lives encontradas** pelas buscas oficiais (YouTube Data API v3 e API Helix da Twitch). As buscas **não garantem cobertura completa**.

> Projeto independente de fãs. Não afiliado à Rockstar Games, Take-Two Interactive, YouTube ou Twitch. GTA e Grand Theft Auto são marcas de seus respectivos proprietários.

## Status

**Em produção:** https://radardelives.darioreis.dev — Vercel + Upstash Redis + Vercel Web Analytics.

MVP do [PRD](docs/product/PRD_Radar_de_Lives_GTA6.md) concluído e verificado em produção (fatias 001–007). A **Twitch** está ativa desde 2026-11-25 (adendo do PRD, seção 12; plano em [`docs/plans/multiplataforma.md`](docs/plans/multiplataforma.md)). A **Kick** depende do spike [#31](https://github.com/darioreisjr/radar-de-lives/issues/31). Veja [Pendências](#pendências).

## Funcionalidades

- Aceite da política na primeira visita ("Li e concordo. Continuar"), exigido pelas políticas do YouTube. Antes dele, o site não busca lives nem carrega miniaturas de nenhuma plataforma; a escolha fica só no navegador ([spec 016](docs/specs/016-consent-notice/)).
- **Uma lista só**, com as lives das plataformas ativas intercaladas por posição. Com mais de uma plataforma: selo de texto em cada card ("YouTube", "Twitch"), filtro "Plataforma" e contagem por plataforma no radar ([spec 026](docs/specs/026-platform-badge-filter/)).
- Painel do radar no topo da página: lives no ar, por plataforma, distribuição por idioma estimado e maior público informado, calculados da mesma consulta da grade (sem quota extra e sem números inventados).
- Grade de lives com miniatura, título, canal, horário de início, idioma estimado e espectadores (ou "Não informado", nunca zero). Selo "Conteúdo adulto" quando a plataforma marca o canal (na Twitch, pelos rótulos de classificação; o rótulo do jogo sozinho não conta).
- Busca por texto, filtros de plataforma e de idioma estimado (pt/en/es/outro), ordenação por relevância, espectadores ou mais recentes.
- Botão "Atualizar" com cooldown de 30 s e "Carregar mais" por clique (sem rolagem infinita).
- Link para a plataforma (nova aba) e "Assistir aqui": diálogo que confere se a live continua, pede consentimento e só então carrega o **player oficial** da plataforma, sem autoplay, sempre com "Abrir no YouTube"/"Abrir na Twitch" como alternativa. Na Twitch, o diálogo avisa que a plataforma pode pedir login ([spec 044](docs/specs/044-twitch-login-notice/)).
- Estados de carregamento, vazio, erro, quota esgotada, dados antigos (stale), resultado parcial (uma plataforma fora do ar), live encerrada, incorporação desativada e tela estreita para o player.
- Páginas de [privacidade](https://radardelives.darioreis.dev/privacy) e [termos](https://radardelives.darioreis.dev/terms) e imagem de compartilhamento (Open Graph) no mesmo visual da home.
- Acessível por teclado, contraste WCAG verificado por teste, respeita `prefers-reduced-motion`.

## Visual

Interface noturna e discreta, polida com a skill [unslop](https://github.com/heydamir/unslop) (Damir Sokolovsky, CC BY 4.0) dentro dos tokens do PRD ([spec 007](docs/specs/007-unslop-home/)):

- A cor fica no conteúdo: as miniaturas das lives e o painel do radar. Fundo, cards e controles usam neutros com contornos finos.
- **Uma única ação rosa** por tela ("Ver lives encontradas"); as ações dos cards são neutras.
- Ciano para dados (espectadores, barra principal do painel) e vermelho só no ponto "ao vivo", a assinatura do site.
- Oswald 500 apenas nos títulos grandes (home e páginas legais); o resto em Geist, sem caixa alta e com números tabulares.
- Sem texto em gradiente, manchas de cor, texturas ou sombras coloridas. Movimento curto: hover com contorno e 2 px de elevação, entrada única com escalonamento em até 6 cards.

Cores e contraste ficam em `lib/config/design-tokens.ts` e são verificados por `tests/contrast.test.ts`.

## Limitações conhecidas

- **Cobertura:** no YouTube, a busca depende de títulos, idioma e região; na Twitch, da categoria "Grand Theft Auto VI" e dos idiomas pt/en/es, até 100 lives (as de maior público) por padrão. Lives fora disso não aparecem.
- **Quota do YouTube:** 100 buscas/dia por padrão. Quando acaba, o site mostra resultados salvos (sinalizados) ou o aviso de limite até a renovação (meia-noite do Pacífico); com outra plataforma ativa, as lives dela continuam aparecendo.
- **Idioma e relação com o jogo são estimados** a partir de metadados e título.
- **Lives podem terminar** depois da última atualização; o player confere antes de abrir.
- O app não detecta erros dentro do player incorporado (direitos autorais, região); o link para a plataforma fica sempre visível.
- **Twitch pede login no player:** GTA 6 é classificado como jogo para adultos na Twitch, e o player embutido exige conta logada (e cookies de terceiros liberados). Quem não estiver logado usa "Abrir na Twitch".
- **Twitch em telas estreitas:** o player exige 400×300 px; abaixo disso, o diálogo mostra só o link.
- **Lista intercalada:** com mais lives da Twitch que do YouTube, o fim da lista tem só lives da Twitch.

## Stack

Next.js 16.4 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Zod · `@upstash/redis` · `@vercel/analytics` · Vitest · Playwright. Gerenciador: **npm**.

## Rodar localmente

Requer Node.js 22.12 ou mais recente.

```bash
npm install
cp .env.example .env.local   # preencha YOUTUBE_API_KEY
npm run dev                  # http://localhost:3000
```

Sem `YOUTUBE_API_KEY`, `GET /api/lives` responde `503 missing_api_key`. Em desenvolvimento, a página mostra **dados simulados** marcados como tal; em produção, uma mensagem neutra de indisponibilidade.

Sem as variáveis do Upstash, cache, quota e rate limit ficam em memória — adequado para desenvolvimento.

Por padrão (`LIVES_PROVIDERS` vazia ou `youtube`), só o YouTube fica ativo. Para ligar a Twitch, veja [Ligar a Twitch](#ligar-a-twitch).

### Obter a chave do YouTube

1. Google Cloud Console → crie/selecione um projeto → ative **YouTube Data API v3**.
2. Credenciais → **Criar chave de API** → em "Restrições de API", permita só **YouTube Data API v3**. Deixe "Restrições de aplicativo" como **Nenhuma** (a chave é usada pelo servidor; a Vercel não tem IP fixo).
3. Coloque em `.env.local` como `YOUTUBE_API_KEY=...` (nunca com `NEXT_PUBLIC_`).

### Ligar a Twitch

1. Em https://dev.twitch.tv/console (a conta precisa de 2FA), **Register Your Application**: nome livre, OAuth Redirect URL `http://localhost`, categoria **Website Integration**, tipo de cliente **Confidential**. Copie o **Client ID** e gere um **Client Secret**.
2. Em `.env.local` (nunca com `NEXT_PUBLIC_`, nunca em commit, issue ou chat):
   ```bash
   LIVES_PROVIDERS=youtube,twitch
   TWITCH_CLIENT_ID=...
   TWITCH_CLIENT_SECRET=...
   ```
   `TWITCH_GAME_ID` já vem com o padrão `1867279146` (Grand Theft Auto VI); só mude se a Twitch trocar o id.
3. Reinicie `npm run dev` (a lista de plataformas é lida ao iniciar e no build).
4. Confira: `GET http://localhost:3000/api/lives` traz `sources` com `youtube` e `twitch`; a home mostra o filtro "Plataforma" e os selos nos cards.

Sem `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET`, a Twitch fica de fora mesmo listada em `LIVES_PROVIDERS` (com o aviso `provider_disabled` no log), e o site segue só com o YouTube. Sem `YOUTUBE_API_KEY`, o YouTube aparece como indisponível e a Twitch continua.

## Variáveis de ambiente

| Variável | Obrigatória | Padrão | Uso |
| --- | --- | --- | --- |
| `YOUTUBE_API_KEY` | sim | — | Chave da YouTube Data API v3 (somente servidor). Na Vercel: **só Production**. |
| `LIVES_PROVIDERS` | não | `youtube` | Plataformas ativas, separadas por vírgula, na ordem de intercalação: `youtube`, `twitch` (e `kick`, quando existir). Mudar na Vercel exige redeploy. |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | para a Twitch | — | Credenciais do app da Twitch (somente servidor). Sem as duas, a Twitch fica de fora. |
| `TWITCH_GAME_ID` | não | `1867279146` | Categoria "Grand Theft Auto VI" na Twitch. |
| `TWITCH_MAX_PAGES` | não | `1` | Páginas de 100 lives buscadas na Twitch (1 a 3), das de maior público. |
| `TWITCH_CACHE_TTL_SECONDS` | não | `180` | Validade do cache da Twitch (30 a 3600). |
| `TWITCH_STALE_TTL_SECONDS` | não | `600` | Tempo extra para servir dados antigos se a Twitch falhar (0 a 3600). |
| `NEXT_PUBLIC_SITE_URL` | produção | `siteConfig.url` | URL pública (Open Graph). |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | produção | — | Estado compartilhado. Também aceita `KV_REST_API_URL` / `KV_REST_API_TOKEN` (criadas pela integração da Vercel). |
| `RATE_LIMIT_SECRET` | não | token do Upstash | Chave do HMAC que pseudonimiza o IP no rate limit. |
| `LIVE_CACHE_TTL_SECONDS` | não | `900` | Validade do cache de resultados do YouTube. |
| `LIVE_STALE_TTL_SECONDS` | não | `600` | Tempo extra para servir dados antigos se o YouTube falhar. |
| `LIVE_RATE_LIMIT_SECONDS` | não | `30` | Intervalo mínimo entre buscas no YouTube e na Twitch (trava compartilhada, uma por plataforma). |
| `YOUTUBE_SEARCH_DAILY_BUDGET` | não | `90` | Limite diário de `search.list` (quota padrão: 100). |
| `YOUTUBE_DETAILS_DAILY_BUDGET` | não | `2000` | Limite diário de revalidações (`videos.list`). |
| `YOUTUBE_DEFAULT_REGION` / `YOUTUBE_DEFAULT_LANGUAGE` | não | `BR` / `pt` | Região e idioma de relevância da busca. |

Modelo completo em [.env.example](.env.example).

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run lint` | ESLint |
| `npm run typecheck` | Gera tipos de rota e roda `tsc --noEmit` |
| `npm test` | Testes unitários (Vitest, 259 testes em 26 arquivos), sem chamadas reais às APIs |
| `npm run test:e2e` | Testes de interface (Playwright, 72 testes: 36 em desktop e 36 em 375 px), sem chave, sem quota e sem chamadas à Twitch. Antes, uma vez: `npx playwright install chromium`. Com `E2E_BASE_URL=<url>`, roda contra um deploy |
| `npm run build` / `npm start` | Build e servidor de produção |

## API

`GET /api/lives?q=&lang=all|pt|en|es&sort=relevance|viewers|recent&pageToken=`

- `q` ≤ 80 caracteres; `pageToken` `[A-Za-z0-9_-]{1,128}`; outros parâmetros → `400`.
- `q`, `lang` e `sort` filtram resultados já buscados (sem gastar quota).
- Resposta: `items`, `updatedAt`, `cached`, `stale`, `nextPageToken`, `sources` e `source`.
  - Cada item tem `id` (`<plataforma>:<sourceId>`), `platform`, `sourceId`, `isMature` e `rank`. `videoId` é **obsoleto** (igual a `sourceId`).
  - `sources`: um status por plataforma ativa (`platform`, `ok`, `cached`, `stale`, `updatedAt`, `errorCode`). Se uma falhar, as outras continuam e a página mostra o aviso de resultado parcial.
  - `stale` é `true` se alguma plataforma serviu dados antigos. `source` só distingue dados reais de dados simulados de desenvolvimento.

`GET /api/status/{platform}/{id}` — revalida uma live ao abrir o player (`platform` = `youtube` ou `twitch`; na Twitch, `id` é o login do canal): `platform`, `sourceId`, `state` (`live|ended|upcoming|unavailable`), `embedAllowed`, `concurrentViewers`, `checkedAt`, `cached`. Cache de 60 s. Plataforma inativa ou id inválido → `400`.

`GET /api/lives/{videoId}` — **obsoleta**; mesma resposta de `/api/status/youtube/{videoId}`.

Erros: `missing_api_key`, `quota_exceeded`, `rate_limited`, `upstream_unavailable`, `upstream_config`, `invalid_params`. Rate limit: 30 requisições/minuto por cliente.

## Quota e estado compartilhado

Conforme a documentação oficial consultada em 21/11/2026: `search.list` tem **bucket próprio de 100 chamadas/dia**; `videos.list` custa 1 unidade de 10.000/dia. Os 7 termos de busca são unidos com `|` em **uma** chamada: cada atualização usa 1 `search.list` + 1 `videos.list`.

Em produção, o Upstash Redis guarda e compartilha entre todas as instâncias:

- cache de resultados (YouTube 15 min; Twitch 3 min) e de revalidações (60 s);
- orçamento diário por método (reset à meia-noite do Pacífico);
- trava que impede buscas simultâneas em cada plataforma;
- rate limit por cliente (o IP é pseudonimizado com HMAC-SHA256; nunca é gravado em claro).

Se o Upstash falhar, o app **não** chama o YouTube nem a Twitch (protege quota e limites) e serve dados salvos quando houver; o rate limit deixa a requisição passar.

**Twitch:** token de app (client credentials) só em memória, renovado antes de expirar; busca de 1 página por padrão (até 100 lives) mais 1 chamada para os rótulos de conteúdo adulto; cache de 180 s + 600 s de dados antigos, bem abaixo das 24 h permitidas pelo Developer Agreement. Limite da Helix: 800 pontos/min.

**Ambientes:** Production usa as chaves de sempre no Redis; Preview e Development usam um prefixo próprio (`preview:`, `development:`), para que um Preview nunca grave no cache da produção ([spec 036](docs/specs/036-preview-store-isolation/)).

## Telemetria e analytics

- **Logs do servidor** (`lib/telemetry.ts`): eventos JSON por linha — `youtube_call`, `youtube_error`, `budget_exhausted`, `stale_served`, `route_error`, `store_error`, `store_memory_in_production`, `provider_failed`, `provider_disabled`, `config_warning`, `twitch_token`, `twitch_error`, `twitch_call`. Sem IP, chave, token ou URLs do YouTube. Na Vercel, os logs de runtime ficam disponíveis por cerca de 1 hora.
- **Vercel Web Analytics**: page views sem cookies de terceiros; a URL é enviada sem query string nem fragmento.

## Deploy (Vercel + Upstash)

1. Importe o repositório na Vercel.
2. **Storage → Marketplace → Upstash Redis**: crie o banco (região próxima às funções, ex.: `us-east-1` para `iad1`) e conecte ao projeto.
3. **Settings → Environment Variables**: `YOUTUBE_API_KEY` (só Production), `NEXT_PUBLIC_SITE_URL`; opcional `RATE_LIMIT_SECRET`.
4. **Settings → Domains**: adicione o domínio e crie o registro DNS indicado.
5. **Analytics → Enable**.
6. Confira nos logs: `youtube_call` presente e **nenhum** `store_memory_in_production` ou `store_error`.

Para mudar os ambientes de uma variável, use o painel: na Vercel CLI 59.x, `vercel env rm <nome> <ambiente>` removeu a variável de todos os ambientes.

### Ligar, desligar e voltar uma plataforma

- **Ligar (ex.: Twitch):** cadastre `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET` pelo painel, primeiro em **Preview**; inclua a plataforma em `LIVES_PROVIDERS` (`youtube,twitch`) e faça o redeploy. Confira o Preview; depois repita em **Production**, no mesmo deploy que publica `/privacy` e `/terms` citando a plataforma.
- **Desligar:** tire a plataforma de `LIVES_PROVIDERS` em Production e faça o redeploy (painel → "Redeploy", ou `vercel redeploy <último deploy> --target production`). Leva cerca de 1 minuto, sem mudar código; ensaiado em 2026-11-25.
- **Conferir:** `GET /api/lives` → `sources` com as plataformas esperadas; `GET /api/status/<plataforma>/<id>` responde `400` para plataforma desligada.
- No Preview não há `YOUTUBE_API_KEY`: lá o YouTube aparece como indisponível e só as outras plataformas mostram lives.

## Pendências

- **Multiplataforma:** issues do épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28); plano, portões e registro de monitoramento em [`docs/plans/multiplataforma.md`](docs/plans/multiplataforma.md). A Kick (#48 a #55) depende do spike #31.
- **Sprint de finalização** ([`sprint.md`](sprint.md), S-01 a S-15): concluído em 2026-11-23.
- Não apagar `public/googleae0552e8a704d280.html`: é a verificação do Google Search Console.
- Registros de legítimo interesse e de transferência internacional guardados pelo responsável (fora do repositório; revisão anual). Se Vercel ou Upstash oferecerem as cláusulas-padrão da ANPD, atualizar a seção "Transferência internacional" de `/privacy`.

## Desenvolvimento

O projeto segue **Spec-Driven Development** ([skill](.claude/skills/sdd/SKILL.md)): cada mudança tem `spec.md`, `plan.md` e `tasks.md` em `docs/specs/`.

**Trabalho pendente:** issues do épico #28 e [`sprint.md`](sprint.md). Cada tarefa usa a branch `sprint/<id>` e só altera os arquivos listados nela.

**CI:** cada push e PR para `main` roda lint, typecheck, testes e build no GitHub Actions, e confere que o bundle do cliente não contém o endpoint de token nem o nome das credenciais da Twitch ou da Kick; se passarem, o job `e2e` roda os 72 testes de interface (Playwright) ([`ci.yml`](.github/workflows/ci.yml), [spec 009](docs/specs/009-ci/)).

| Fatia | Conteúdo | Status |
| --- | --- | --- |
| [001-foundation](docs/specs/001-foundation/) | Base visual, `GET /api/lives`, cache, deduplicação, quota | ✅ |
| [002-player-and-states](docs/specs/002-player-and-states/) | Player com consentimento, revalidação, estados de live | ✅ |
| [003-launch-readiness](docs/specs/003-launch-readiness/) | Privacidade, termos, Open Graph, contraste, telemetria | ✅ |
| [004-real-key-validation](docs/specs/004-real-key-validation/) | Validação com dados reais, calibração do idioma | ✅ |
| [005-shared-store](docs/specs/005-shared-store/) | Upstash Redis e deploy na Vercel | ✅ |
| [006-web-analytics](docs/specs/006-web-analytics/) | Vercel Web Analytics | ✅ |
| [007-unslop-home](docs/specs/007-unslop-home/) | Polimento visual, painel do radar, imagem Open Graph | ✅ |
| [008-lgpd-privacy](docs/specs/008-lgpd-privacy/) | Itens da LGPD na política (S-02) | ✅ |
| [009-ci](docs/specs/009-ci/) | CI no GitHub Actions (S-04) | ✅ |
| [010-security-headers](docs/specs/010-security-headers/) | Cabeçalhos de segurança HTTP (S-05) | ✅ |
| [011-docs-cleanup](docs/specs/011-docs-cleanup/) | Documentação atualizada (S-06) | ✅ |
| [012-seo-robots-sitemap](docs/specs/012-seo-robots-sitemap/) | `robots.txt` e `sitemap.xml` (S-07) | ✅ |
| [013-license](docs/specs/013-license/) | Licença MIT (S-08) | ✅ |
| [014-ui-tests](docs/specs/014-ui-tests/) | Testes de interface com Playwright (S-09) | ✅ |
| [015-manual-qa](docs/specs/015-manual-qa/) | QA de estados e movimento reduzido (S-10) | ✅ |
| [016-consent-notice](docs/specs/016-consent-notice/) | Aceite da política e textos legais revisados (S-01, S-11) | ✅ |
| [017-csp](docs/specs/017-csp/) | Content Security Policy completa (S-12) | ✅ |
| [018-player-status-badge](docs/specs/018-player-status-badge/) | Selo do player conforme o estado revalidado (bug da S-10) | ✅ |
| [019-twitch-research](docs/specs/019-twitch-research/) | Spike: API Helix da Twitch para lives de GTA 6 | ✅ |
| [020-kick-research](docs/specs/020-kick-research/) | Spike: API pública da Kick (aguarda dados do responsável, #31) | ⏳ |
| [021-platform-model](docs/specs/021-platform-model/) | Modelo de live independente de plataforma (`id`, `platform`, `sourceId`) | ✅ |
| [022-providers-aggregator](docs/specs/022-providers-aggregator/) | Contrato `LivesProvider` e agregador com isolamento de falhas | ✅ |
| [023-provider-flags](docs/specs/023-provider-flags/) | Ligar e desligar plataformas com `LIVES_PROVIDERS` | ✅ |
| [024-status-route-by-platform](docs/specs/024-status-route-by-platform/) | Rota `/api/status/[platform]/[id]` | ✅ |
| [025-player-by-platform](docs/specs/025-player-by-platform/) | Player e revalidação conforme a plataforma | ✅ |
| [026-platform-badge-filter](docs/specs/026-platform-badge-filter/) | Selo e filtro de plataforma, aviso de resultado parcial | ✅ |
| [027-twitch-client](docs/specs/027-twitch-client/) | Credenciais e cliente HTTP da Twitch com token de app | ✅ |
| [028-twitch-search](docs/specs/028-twitch-search/) | Busca de lives de GTA 6 na Twitch e normalização | ✅ |
| [029-twitch-service](docs/specs/029-twitch-service/) | Serviço da Twitch com cache e registro no agregador | ✅ |
| [030-twitch-status](docs/specs/030-twitch-status/) | Revalidação de lives da Twitch | ✅ |
| [031-twitch-csp](docs/specs/031-twitch-csp/) | CSP: miniaturas e player da Twitch | ✅ |
| [032-twitch-player](docs/specs/032-twitch-player/) | Player embutido da Twitch, com link de fallback | ✅ |
| [033-twitch-legal](docs/specs/033-twitch-legal/) | Twitch na política de privacidade e nos termos | ✅ |
| [034-multiplatform-copy](docs/specs/034-multiplatform-copy/) | Textos, metadata e imagem OG conforme as plataformas ativas | ✅ |
| [035-twitch-max-pages](docs/specs/035-twitch-max-pages/) | Busca da Twitch limitada a 1 página por padrão | ✅ |
| [036-preview-store-isolation](docs/specs/036-preview-store-isolation/) | Chaves do Redis do Preview separadas da produção | ✅ |
| [042-multiplatform-qa](docs/specs/042-multiplatform-qa/) | QA manual com YouTube e Twitch | ✅ |
| [043-multiplatform-docs](docs/specs/043-multiplatform-docs/) | Documentação multiplataforma | ✅ |
| [044-twitch-login-notice](docs/specs/044-twitch-login-notice/) | Aviso de login antes do player da Twitch | ✅ |
| [045-player-focus-return](docs/specs/045-player-focus-return/) | Foco volta ao card ao fechar o player de live encerrada | ✅ |

**Commits:** [Conventional Commits](https://www.conventionalcommits.org/pt-br/) em pt-BR, sem linha de coautor (ex.: `feat(store): ...`, `docs(specs): ...`).

**Windows + npm 11:** `npm install` pode remover do lockfile as bindings nativas do rolldown (npm/cli#4828), quebrando `npm test`. Em 2026-11-23 isso aconteceu mesmo com `node_modules` limpo. O contorno que preserva as outras versões é mesclar no lockfile original só as entradas novas do pacote e validar com `npm ci` (ver spec 014, D4).

Orientações para agentes: [CLAUDE.md](CLAUDE.md).
