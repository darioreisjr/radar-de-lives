# Radar de Lives

Diretório independente para encontrar transmissões **públicas** do YouTube que estejam ao vivo e relacionadas a GTA 6.
Mostra **lives encontradas** pela busca da YouTube Data API v3. A busca **não garante cobertura completa**.

> Projeto independente de fãs. Não afiliado à Rockstar Games, Take-Two Interactive ou YouTube. GTA e Grand Theft Auto são marcas de seus respectivos proprietários.

## Status

**Em produção:** https://radardelives.darioreis.dev — Vercel + Upstash Redis + Vercel Web Analytics.

MVP do [PRD](docs/product/PRD_Radar_de_Lives_GTA6.md) concluído e verificado em produção (fatias 001–007). O trabalho de finalização está no [`sprint.md`](sprint.md); veja [Pendências](#pendências).

## Funcionalidades

- Aceite da política na primeira visita ("Li e concordo. Continuar"), exigido pelas políticas do YouTube. Antes dele, o site não busca lives nem carrega miniaturas; a escolha fica só no navegador ([spec 016](docs/specs/016-consent-notice/)).
- Painel do radar no topo da página: lives no ar, distribuição por idioma estimado e maior público informado, calculados da mesma consulta da grade (sem quota extra e sem números inventados).
- Grade de lives com miniatura, título, canal, horário de início, idioma estimado e espectadores (ou "Não informado", nunca zero).
- Busca por texto, filtro de idioma estimado (pt/en/es/outro), ordenação por relevância, espectadores ou mais recentes.
- Botão "Atualizar" com cooldown de 30 s e "Carregar mais" por clique (sem rolagem infinita).
- "Assistir no YouTube" (nova aba) e "Assistir aqui": diálogo que confere se a live continua, pede consentimento e só então carrega o player oficial, sem autoplay, sempre com "Abrir no YouTube" como alternativa.
- Estados de carregamento, vazio, erro, quota esgotada, dados antigos (stale), live encerrada e incorporação desativada.
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

- **Cobertura:** a busca depende de títulos, idioma e região; lives sem os termos configurados não aparecem.
- **Quota do YouTube:** 100 buscas/dia por padrão. Quando acaba, o site mostra resultados salvos (sinalizados) ou o aviso de limite até a renovação (meia-noite do Pacífico).
- **Idioma e relação com o jogo são estimados** a partir de metadados e título.
- **Lives podem terminar** depois da última atualização; o player confere antes de abrir.
- O app não detecta erros dentro do player incorporado (direitos autorais, região); o link para o YouTube fica sempre visível.

## Stack

Next.js 16.4 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Zod · `@upstash/redis` · `@vercel/analytics` · Vitest. Gerenciador: **npm**.

## Rodar localmente

Requer Node.js 22.12 ou mais recente.

```bash
npm install
cp .env.example .env.local   # preencha YOUTUBE_API_KEY
npm run dev                  # http://localhost:3000
```

Sem `YOUTUBE_API_KEY`, `GET /api/lives` responde `503 missing_api_key`. Em desenvolvimento, a página mostra **dados simulados** marcados como tal; em produção, uma mensagem neutra de indisponibilidade.

Sem as variáveis do Upstash, cache, quota e rate limit ficam em memória — adequado para desenvolvimento.

### Obter a chave do YouTube

1. Google Cloud Console → crie/selecione um projeto → ative **YouTube Data API v3**.
2. Credenciais → **Criar chave de API** → em "Restrições de API", permita só **YouTube Data API v3**. Deixe "Restrições de aplicativo" como **Nenhuma** (a chave é usada pelo servidor; a Vercel não tem IP fixo).
3. Coloque em `.env.local` como `YOUTUBE_API_KEY=...` (nunca com `NEXT_PUBLIC_`).

## Variáveis de ambiente

| Variável | Obrigatória | Padrão | Uso |
| --- | --- | --- | --- |
| `YOUTUBE_API_KEY` | sim | — | Chave da YouTube Data API v3 (somente servidor). Na Vercel: **só Production**. |
| `NEXT_PUBLIC_SITE_URL` | produção | `siteConfig.url` | URL pública (Open Graph). |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | produção | — | Estado compartilhado. Também aceita `KV_REST_API_URL` / `KV_REST_API_TOKEN` (criadas pela integração da Vercel). |
| `RATE_LIMIT_SECRET` | não | token do Upstash | Chave do HMAC que pseudonimiza o IP no rate limit. |
| `LIVE_CACHE_TTL_SECONDS` | não | `900` | Validade do cache de resultados. |
| `LIVE_STALE_TTL_SECONDS` | não | `600` | Tempo extra para servir dados antigos se o YouTube falhar. |
| `LIVE_RATE_LIMIT_SECONDS` | não | `30` | Intervalo mínimo entre buscas no YouTube (trava compartilhada). |
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
| `npm test` | Testes unitários (Vitest, 106 testes) |
| `npm run build` / `npm start` | Build e servidor de produção |

## API

`GET /api/lives?q=&lang=all|pt|en|es&sort=relevance|viewers|recent&pageToken=`

- `q` ≤ 80 caracteres; `pageToken` `[A-Za-z0-9_-]{1,128}`; outros parâmetros → `400`.
- `q`, `lang` e `sort` filtram resultados já buscados (sem gastar quota).
- Resposta: `items`, `updatedAt`, `cached`, `stale`, `nextPageToken`, `source`.

`GET /api/lives/{videoId}` — revalida um vídeo ao abrir o player: `state` (`live|ended|upcoming|unavailable`), `embedAllowed`, `concurrentViewers`, `checkedAt`, `cached`. Cache de 60 s.

Erros (ambas): `missing_api_key`, `quota_exceeded`, `rate_limited`, `upstream_unavailable`, `upstream_config`, `invalid_params`. Rate limit: 30 requisições/minuto por cliente.

## Quota e estado compartilhado

Conforme a documentação oficial consultada em 21/11/2026: `search.list` tem **bucket próprio de 100 chamadas/dia**; `videos.list` custa 1 unidade de 10.000/dia. Os 7 termos de busca são unidos com `|` em **uma** chamada: cada atualização usa 1 `search.list` + 1 `videos.list`.

Em produção, o Upstash Redis guarda e compartilha entre todas as instâncias:

- cache de resultados (15 min) e de revalidações (60 s);
- orçamento diário por método (reset à meia-noite do Pacífico);
- trava que impede buscas simultâneas no YouTube;
- rate limit por cliente (o IP é pseudonimizado com HMAC-SHA256; nunca é gravado em claro).

Se o Upstash falhar, o app **não** chama o YouTube (protege a quota) e serve dados salvos quando houver; o rate limit deixa a requisição passar.

## Telemetria e analytics

- **Logs do servidor** (`lib/telemetry.ts`): eventos JSON por linha — `youtube_call`, `youtube_error`, `budget_exhausted`, `stale_served`, `route_error`, `store_error`, `store_memory_in_production`. Sem IP, chave ou URLs do YouTube.
- **Vercel Web Analytics**: page views sem cookies de terceiros; a URL é enviada sem query string nem fragmento.

## Deploy (Vercel + Upstash)

1. Importe o repositório na Vercel.
2. **Storage → Marketplace → Upstash Redis**: crie o banco (região próxima às funções, ex.: `us-east-1` para `iad1`) e conecte ao projeto.
3. **Settings → Environment Variables**: `YOUTUBE_API_KEY` (só Production), `NEXT_PUBLIC_SITE_URL`; opcional `RATE_LIMIT_SECRET`.
4. **Settings → Domains**: adicione o domínio e crie o registro DNS indicado.
5. **Analytics → Enable**.
6. Confira nos logs: `youtube_call` presente e **nenhum** `store_memory_in_production` ou `store_error`.

Para mudar os ambientes de uma variável, use o painel: na Vercel CLI 59.x, `vercel env rm <nome> <ambiente>` removeu a variável de todos os ambientes.

## Pendências

O trabalho pendente está organizado no [`sprint.md`](sprint.md), em tarefas independentes (S-01 a S-15). O estado de cada uma fica na seção [Definição de 100%](sprint.md#definição-de-100).

- Já resolvidas: revisão dos textos legais (S-01) e restrição da chave no Google Cloud (S-03).
- Pendências do responsável, sem código: confirmar com Vercel e Upstash o mecanismo de transferência internacional, e guardar o registro de legítimo interesse do limite de requisições (ver S-01).

## Desenvolvimento

O projeto segue **Spec-Driven Development** ([skill](.claude/skills/sdd/SKILL.md)): cada mudança tem `spec.md`, `plan.md` e `tasks.md` em `docs/specs/`.

**Trabalho pendente:** [`sprint.md`](sprint.md). Cada tarefa usa a branch `sprint/<id>` e só altera os arquivos listados nela.

**CI:** cada push e PR para `main` roda lint, typecheck, testes e build no GitHub Actions ([`ci.yml`](.github/workflows/ci.yml), [spec 009](docs/specs/009-ci/)).

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
| [011-docs-cleanup](docs/specs/011-docs-cleanup/) | Documentação atualizada (S-06) | ✅ |
| [012-seo-robots-sitemap](docs/specs/012-seo-robots-sitemap/) | `robots.txt` e `sitemap.xml` (S-07) | ✅ |
| [016-consent-notice](docs/specs/016-consent-notice/) | Aceite da política e textos legais revisados (S-01, S-11) | ✅ |

**Commits:** [Conventional Commits](https://www.conventionalcommits.org/pt-br/) em pt-BR, sem linha de coautor (ex.: `feat(store): ...`, `docs(specs): ...`).

**Windows + npm 11:** `npm install` pode remover do lockfile as bindings nativas do rolldown (npm/cli#4828), quebrando `npm test`. Contorno: apagar `node_modules` e `package-lock.json`, reinstalar e conferir que só o pacote novo mudou.

Orientações para agentes: [CLAUDE.md](CLAUDE.md).
