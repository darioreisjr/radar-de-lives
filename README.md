# Radar de Lives

Diretório independente para encontrar transmissões **públicas** do YouTube que estejam ao vivo e relacionadas a GTA 6.
Mostra **lives encontradas** pela busca da YouTube Data API v3. A busca **não garante cobertura completa**.

> Projeto independente de fãs. Não afiliado à Rockstar Games, Take-Two Interactive ou YouTube. GTA e Grand Theft Auto são marcas de seus respectivos proprietários.

## Stack

Next.js 16.4 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Zod · Vitest. Gerenciador: **npm**.

## Rodar localmente

Requer Node.js 22.12 ou mais recente.

```bash
npm install
cp .env.example .env.local   # preencha YOUTUBE_API_KEY
npm run dev                  # http://localhost:3000
```

Sem `YOUTUBE_API_KEY`, `GET /api/lives` responde `503 missing_api_key`. Em desenvolvimento, a página mostra **dados simulados** marcados como tal. Em produção, mostra o aviso de configuração.

### Obter a chave

1. Google Cloud Console → crie/seleciona um projeto → ative **YouTube Data API v3**.
2. Credenciais → **Criar chave de API** → restrinja a chave a essa API.
3. Coloque em `.env.local` como `YOUTUBE_API_KEY=...` (nunca com `NEXT_PUBLIC_`).

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Testes unitários (Vitest) |
| `npm run build` / `npm start` | Build e servidor de produção |

## API

`GET /api/lives/{videoId}` — revalida um vídeo ao abrir o player (`state`: `live|ended|upcoming|unavailable`, `embedAllowed`, `concurrentViewers`, `checkedAt`, `cached`). Cache de 60 s, 1 unidade de `videos.list` por consulta nova, limitada por `YOUTUBE_DETAILS_DAILY_BUDGET`.

`GET /api/lives?q=&lang=all|pt|en|es&sort=relevance|viewers|recent&pageToken=`

- `q` ≤ 80 caracteres; `pageToken` `[A-Za-z0-9_-]{1,128}`; outros parâmetros → `400`.
- `q`, `lang` e `sort` filtram resultados já buscados (sem gastar quota).
- Resposta: `items`, `updatedAt`, `cached`, `stale`, `nextPageToken`, `source`.
- Erros: `missing_api_key`, `quota_exceeded`, `rate_limited`, `upstream_unavailable`, `upstream_config`, `invalid_params`.

## Quota (confirme no Google Cloud Console)

Conforme a documentação oficial consultada em 21/11/2026: `search.list` tem **bucket próprio de 100 chamadas/dia**; `videos.list` custa 1 unidade dos 10.000/dia. Com TTL de 900 s, cada atualização usa **1 search.list + 1 videos.list** (termos unidos com `|`). O cache, o intervalo mínimo, o orçamento diário e o cooldown de 30 s protegem a quota. Cache e contadores ficam **em memória**: em produção com várias instâncias, troque por cache compartilhado (`lib/cache/types.ts`).

## Player incorporado

"Assistir aqui" abre um diálogo que confere se a live continua, pede consentimento antes de carregar o player oficial (`youtube.com/embed`, sem autoplay) e sempre oferece "Abrir no YouTube".

## Deploy na Vercel + Upstash

1. Envie o repositório ao GitHub e importe-o na Vercel.
2. Na Vercel: **Storage → Marketplace → Upstash Redis** → crie o banco e conecte ao projeto. As variáveis `UPSTASH_REDIS_REST_URL`/`TOKEN` (ou `KV_REST_API_*`) são criadas automaticamente.
3. Em **Settings → Environment Variables** (Production): `YOUTUBE_API_KEY` e `NEXT_PUBLIC_SITE_URL=https://radardelives.darioreis.dev`. Opcional: `RATE_LIMIT_SECRET`.
4. Faça o deploy e adicione o domínio `radardelives.darioreis.dev` em **Settings → Domains**; crie no seu DNS o registro que a Vercel indicar.
5. Confira nos logs da Vercel: deve haver eventos `youtube_call` e **nenhum** `store_memory_in_production`.

Com Upstash, cache, orçamento diário de quota, trava de busca e rate limit são compartilhados por todas as instâncias. Sem Upstash, tudo fica em memória (desenvolvimento local).

O plano gratuito do Upstash (500 mil comandos/mês) basta para tráfego moderado: cada requisição à API usa poucos comandos (rate limit + leitura de cache).

## Antes de lançar

- Revisão jurídica de `/privacy` e `/terms` (responsável e contato já preenchidos em `lib/config/site.ts`).
- Confirme a quota atual no Google Cloud Console.

## Telemetria

Eventos JSON por linha no log do servidor (`lib/telemetry.ts`): `youtube_call`, `youtube_error`, `budget_exhausted`, `stale_served`, `route_error`. Sem IP, chave ou URLs do YouTube.

## Documentação

- PRD: [docs/product/PRD_Radar_de_Lives_GTA6.md](docs/product/PRD_Radar_de_Lives_GTA6.md)
- Specs (SDD): [docs/specs/](docs/specs/)
