# 001 — Fundação + integração inicial do endpoint

Status: implementada e verificada (ver `tasks.md`) · Data: 2026-11-21
Fonte: [PRD](../../product/PRD_Radar_de_Lives_GTA6.md) — Fase 1 completa e fatia funcional da Fase 2.

## 1. Contexto e problema

Fãs de GTA 6 pesquisam repetidamente no YouTube e precisam conferir se cada vídeo ainda está ao vivo. O repositório estava vazio (sem Git, sem código). Esta fatia cria a base do app e a primeira integração com a YouTube Data API v3, para que o Radar mostre **lives encontradas** — nunca "todas as lives".

## 2. Objetivo da fatia

Uma página navegável, responsiva e acessível com identidade visual própria, alimentada por `GET /api/lives`, que consulta o YouTube no servidor com cache, deduplicação, normalização e proteção de quota. Sem chave configurada, o endpoint responde com erro controlado e a interface (fora de produção) mostra dados simulados claramente identificados.

## 3. Escopo

### Incluído
- Next.js 16.4.6 (App Router), TypeScript, Tailwind CSS 4, ESLint, Vitest.
- Tokens de design do PRD, fontes Oswald (títulos), Geist Sans (interface), Geist Mono (números) via `next/font/google` (licença SIL OFL).
- Componentes: SiteHeader, HeroSection (arte original em CSS/SVG), RefreshStatus, FilterBar, LiveGrid, LiveCard, Skeleton, EmptyState, ErrorState, QuotaState, SiteFooter, Badge, Button.
- Filtros funcionais no cliente: texto, idioma estimado, ordenação; botão atualizar com cooldown; "Carregar mais" por ação explícita.
- `GET /api/lives` com validação (Zod), cache em memória, stale-on-error, deduplicação por `videoId`, normalização, orçamento diário de buscas, rate limit por cliente, timeout e retry limitado.
- `.env.example`, README com execução local.

### Excluído (fatias futuras)
- Modal de player incorporado (`LivePlayerDialog`) e página `watch/[videoId]` — Fase 3.
- `channels.list` — não é necessário: `search.list` já traz `channelTitle`.
- Cache compartilhado (Redis/Upstash) — exige decisão de infraestrutura e custo.
- Páginas `privacy`/`terms`, Open Graph com arte, telemetria — Fase 4.
- Tudo de P1 (favoritos, compartilhamento, tema claro, polling).

## 4. Fatos confirmados na documentação oficial (consultada em 2026-11-21)

| Item | Fato |
| --- | --- |
| `search.list` quota | **Bucket próprio: 100 chamadas/dia**, 1 unidade por chamada (determine_quota_cost, getting-started). Cada página extra custa uma chamada. |
| Outros métodos | 10.000 unidades/dia compartilhadas; `videos.list` = 1 unidade. Reset à meia-noite do horário do Pacífico. Requisições inválidas também consomem ≥1 ponto. Quota "sujeita a mudança". |
| `eventType=live` | Exige `type=video`; retorna somente transmissões ativas. |
| `q` | Aceita operador OR `\|` e NOT `-`. |
| `maxResults` | 0–50, padrão 5. A API pode retornar menos itens que o pedido; usar `nextPageToken`. |
| `order` | Valores ≠ `relevance` podem gerar conjunto menor ou incompleto. |
| `regionCode` / `relevanceLanguage` | Região onde o vídeo pode ser visto / idioma preferido para relevância (não é filtro). |
| `videos.list` | `part=snippet,liveStreamingDetails,status`; `id` em lista separada por vírgula (o limite de IDs **não** está declarado na página; usamos ≤ 50). |
| `liveStreamingDetails.concurrentViewers` | Presente **só** se a live tem espectadores e o dono não ocultou a contagem; chega como string. |
| `liveStreamingDetails.actualStartTime` / `actualEndTime` | Início real / fim (só existe após encerrar). |
| `snippet.liveBroadcastContent` | `live`, `upcoming` ou `none`. |
| `status.embeddable` | Booleano; embed ainda pode ser bloqueado por política/Content ID. |
| Erros | `quotaExceeded (403)` documentado. `keyInvalid` e um `rateLimitExceeded` genérico não aparecem na página de erros — tratamos por status HTTP + `reason` quando presente. |

## 5. Decisões assumidas (reversíveis)

- **D1 — Uma busca combinada.** Os 7 termos do PRD viram um único `q` unido por `|`. Com 100 buscas/dia, 7 chamadas por atualização esgotariam a quota em ~14 atualizações. Termos ficam em `lib/youtube/searches.ts` (configuráveis). Risco: o OR pode priorizar alguns termos; não prometemos cobertura.
- **D2 — Orçamento diário de buscas** (`YOUTUBE_SEARCH_DAILY_BUDGET`, padrão 90) contado no processo, por dia no fuso America/Los_Angeles. Esgotado → serve cache stale se houver; senão estado de quota. Contador em memória não é compartilhado entre instâncias.
- **D3 — TTL 900 s** (decidido pelo usuário em 2026-11-21; o PRD sugeria 120 s). Com 120 s e tráfego contínuo seriam ≈ 720 buscas/dia, acima das 100 da quota padrão. Com 900 s, ≈ 96 buscas/dia no pior caso, perto do orçamento de 90 (D2), que continua protegendo a quota.
- **D4 — Stale até 600 s** após o vencimento do TTL quando o YouTube falha ou o orçamento acabou; resposta marca `stale: true`.
- **D5 — Intervalo mínimo entre buscas no upstream** = `LIVE_RATE_LIMIT_SECONDS` (30 s), mesmo com TTL menor; e requisições simultâneas compartilham a mesma promessa (single-flight).
- **D6 — Rate limit por cliente** no Route Handler: 30 req/min por IP (janela fixa, memória) → `429` com `Retry-After`.
- **D7 — Cooldown manual de 30 s** no botão "Atualizar" (cliente). O servidor respeita o cache, então atualizar dentro do TTL não gasta quota.
- **D8 — `q`, `lang`, `sort` filtram o conjunto já buscado**, sem nova chamada ao YouTube (não gastam quota). Termo livre que amplia a busca fica para fatia futura.
- **D9 — Paginação:** `pageToken` busca a página seguinte da consulta combinada (custa 1 busca). Cache por token. Cliente acumula e deduplica.
- **D10 — Revalidação no `videos.list`:** itens com `liveBroadcastContent ≠ live`, com `actualEndTime`, ou ausentes na resposta (privado/removido) são descartados. Se o `videos.list` falhar, usamos os dados do `search.list` com `concurrentViewers: null`, `liveStartedAt: null` e `embedAllowed: "unknown"`.
- **D11 — Idioma estimado:** prefixo de `defaultAudioLanguage`, depois `defaultLanguage` (pt/en/es); senão pistas no título ("ao vivo", "português"… → pt; "en vivo", "directo", "español"… → es); senão `unknown`. "live"/"stream" não indicam inglês porque aparecem em todos os idiomas. Rotulado "estimado" na UI.
- **D12 — Região/idioma padrão** `BR`/`pt` (PRD). `relevanceLanguage` só influencia relevância.
- **D13 — Timeout 8 s**, 1 retry com backoff (500 ms) apenas para rede/5xx. Nunca retry em 4xx.
- **D14 — Miniaturas** via `next/image` com `unoptimized` e `remotePatterns` restrito a `i.ytimg.com` (sem custo de otimização de imagens em hospedagem). Prioridade de tamanho: `high` → `medium` → `default`.
- **D15 — Dados simulados** (`lib/fixtures/lives.ts`) aparecem **somente** quando a API responde `missing_api_key` e `NODE_ENV !== "production"`. A UI exibe faixa "Dados simulados" e selo "SIMULADO" em cada card; links não apontam para vídeos reais.
- **D16 — `safeSearch=moderate`** (padrão da API) mantido explicitamente.
- **D17 — Filtros no cliente:** a UI busca `/api/lives` sem `q/lang/sort` e filtra localmente os itens acumulados (sem requisição por tecla). A rota continua aceitando e aplicando esses parâmetros para outros consumidores.
- **D18 — Ferramentas:** `@types/node` subiu de `^20` para `^22` (peer do Vitest 5; Node local 22.23). `npm test` usa `scripts/test.mjs` por causa de um problema do Vitest com `d:` vs `D:` no Windows. `allowedDevOrigins: ["127.0.0.1"]` habilita o dev server por esse host (só desenvolvimento).

## 6. Requisitos

### Funcionais
- **RF1** `GET /api/lives` aceita `q` (≤ 80 caracteres, aparado), `lang` (`all|pt|en|es`, padrão `all`), `sort` (`relevance|viewers|recent`, padrão `relevance`), `pageToken` (`[A-Za-z0-9_-]{1,128}`). Parâmetro inválido → `400 invalid_params`.
- **RF2** Busca no YouTube com `part=snippet`, `type=video`, `eventType=live`, `maxResults=50`, `q` combinado, `regionCode`, `relevanceLanguage`, `safeSearch=moderate`.
- **RF3** Deduplica por `videoId` (na página e entre páginas no cliente).
- **RF4** Detalhes em lote via um `videos.list` por página.
- **RF5** Normalização conforme modelo do PRD; campos ausentes viram `null`/`"unknown"`; `concurrentViewers` nunca vira 0 quando ausente.
- **RF6** Resposta inclui `updatedAt`, `cached`, `stale`, `nextPageToken`, `source`.
- **RF7** Erros mapeados: `missing_api_key` (503), `quota_exceeded` (503), `rate_limited` (429), `upstream_unavailable` (502), `upstream_config` (502), `invalid_params` (400). Mensagens seguras, sem chave nem resposta bruta do upstream.
- **RF8** UI: header, hero, status de atualização (horário, cache, stale), filtros, grade, cards, skeleton, vazio, erro, quota, rodapé com aviso de independência.
- **RF9** Card: miniatura 16:9, título, canal, badge AO VIVO, espectadores ("Não informado" quando `null`), início, idioma estimado, "Assistir no YouTube" (`target=_blank`, `rel="noopener noreferrer"`).
- **RF10** "Carregar mais" só por clique; nunca por rolagem.

### Não funcionais
- **RNF1** `YOUTUBE_API_KEY` só no servidor (`import "server-only"`), sem `NEXT_PUBLIC_`; a chave nunca aparece em resposta, log ou bundle.
- **RNF2** Acessibilidade: landmarks, labels, foco visível, `aria-live` para status, alvo de toque ≥ 44 px, contraste AA para texto.
- **RNF3** Movimento: durações 140/240/480 ms; hover ≤ 3 px; entrada ≤ 12 px; `prefers-reduced-motion` remove movimento não essencial.
- **RNF4** Layout de 320 px a desktop, sem rolagem horizontal.
- **RNF5** Dependências mínimas: `zod` (runtime), `vitest` (dev).

## 7. Estados

| Estado | Comportamento |
| --- | --- |
| Carregando | Grade de skeletons; status "Buscando lives…" anunciado. |
| Sucesso | Grade + "N lives encontradas" + horário da atualização. |
| Vazio (API) | "Nenhuma live encontrada agora" + explicação de cobertura. |
| Vazio (filtro) | "Nenhum resultado com esses filtros" + limpar filtros. |
| Stale | Faixa: dados de HH:MM, YouTube indisponível no momento. |
| Quota | QuotaState explicando limite diário e reset. |
| Erro temporário | ErrorState com "Tentar novamente". |
| Sem chave | Erro controlado; fora de produção mostra dados simulados rotulados. |
| Live encerrada | Itens já encerrados são removidos na revalidação; o card avisa que a live pode ter terminado depois da busca (via horário). Estado dedicado no player: Fase 3. |

## 8. Contrato da rota

Sucesso `200`:
```json
{
  "items": [{ "videoId": "…", "title": "…", "description": "…", "channelId": "…", "channelTitle": "…",
    "thumbnailUrl": "https://i.ytimg.com/… | null", "publishedAt": "ISO", "liveStartedAt": "ISO | null",
    "concurrentViewers": 123, "language": "pt|en|es|unknown", "watchUrl": "https://www.youtube.com/watch?v=…",
    "embedUrl": "https://www.youtube.com/embed/…", "isLive": true, "embedAllowed": true }],
  "updatedAt": "ISO", "cached": true, "stale": false, "nextPageToken": "… | null", "source": "youtube"
}
```
Erro: `{ "error": { "code": "missing_api_key", "message": "…" }, "retryAfterSeconds": 30 }` (o último campo é opcional).

## 9. Critérios de aceite

1. **CA1** `npm run dev` abre a página com header, hero, status, filtros, grade e rodapé em 375 px e 1440 px sem rolagem horizontal.
2. **CA2** Sem `YOUTUBE_API_KEY`, `GET /api/lives` responde `503` com `code: "missing_api_key"` e instrução segura; o servidor não lança exceção.
3. **CA3** Sem chave e fora de produção, a UI mostra a faixa "Dados simulados" e o selo "SIMULADO" em cada card.
4. **CA4** Parâmetros inválidos (`q` > 80, `lang=fr`, `sort=x`, `pageToken` com caracteres inválidos) → `400 invalid_params`.
5. **CA5** Itens com `videoId` repetido aparecem uma vez (teste unitário).
6. **CA6** `concurrentViewers` ausente → `null` na API e "Não informado" na UI; nunca `0` (teste unitário + UI).
7. **CA7** Resposta `403 quotaExceeded` do YouTube → `quota_exceeded`; com cache stale disponível, responde `200` com `stale: true` (teste unitário).
8. **CA8** Dentro do TTL, requisições repetidas não chamam o YouTube (`cached: true`) (teste unitário).
9. **CA9** Botão "Atualizar" fica desativado por 30 s após uso, com contagem visível.
10. **CA10** A chave não aparece em nenhuma resposta nem em arquivos de `.next/static` (verificação por busca).
11. **CA11** Interface usa "Lives encontradas" e explica que a busca não garante cobertura completa; rodapé tem o aviso de marca do PRD.
12. **CA12** Com `prefers-reduced-motion: reduce`, animações de entrada, hover e pulso ficam desativadas.
13. **CA13** Todos os controles são alcançáveis por Tab com foco visível.
14. **CA14** `lint`, `typecheck`, `test` e `build` executam sem erro.

## 10. Riscos e dependências

- Cobertura da busca depende de metadados; OR combinado pode favorecer alguns termos.
- Quota de 100 buscas/dia é o gargalo; ver D2/D3. Confirmar no Google Cloud Console antes do lançamento.
- Cache e contadores em memória não persistem entre instâncias serverless nem reinícios.
- Datas do YouTube são do momento da consulta; a live pode acabar depois.

## 11. Decisões bloqueadas / para o usuário

- ~~Ajuste do TTL (D3)~~ — resolvido: 900 s.
- Provedor de cache compartilhado em produção (Redis/Upstash ou outro) — custo e infraestrutura.
- Nome final e domínio.
