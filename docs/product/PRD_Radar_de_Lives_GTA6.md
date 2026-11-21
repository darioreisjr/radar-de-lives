# PRD - Radar de Lives GTA 6

Versão: 1.0 | Data: 21/11/2026 | Stack: Next.js, TypeScript, Tailwind CSS, YouTube Data API v3
Nome de trabalho: Radar de Lives | Status: Especificação inicial para implementação

> Transcrição fiel do PRD fornecido pelo usuário em 21/11/2026.

## 1. Visão

Radar de Lives é um diretório independente para encontrar transmissões públicas do YouTube que estejam ao vivo e relacionadas a GTA 6. A aplicação combina buscas configuradas, elimina resultados duplicados e apresenta cards interativos com miniatura, título, canal, espectadores quando disponíveis e links para assistir.

O site da Rockstar é referência de clima cinematográfico, ritmo e narrativa visual. O produto deve ter identidade própria: atmosfera urbana noturna, neon e fotografia de ação. Não copiar logotipo, layout, fontes proprietárias, personagens, screenshots ou artes oficiais.

Limite do produto: a YouTube Data API permite buscar transmissões ativas por palavras-chave, mas não garante um inventário completo de todas as lives sobre o jogo. A interface deve dizer “Lives encontradas”, nunca “Todas as lives do YouTube”. A cobertura depende de metadados, idioma, região e resultados da busca.

## 2. Problema, público e objetivos

Fãs precisam pesquisar repetidamente no YouTube e verificar se cada vídeo ainda está ao vivo. O Radar concentra os resultados encontrados e permite filtrar, ordenar, atualizar e assistir.

Público principal: quem quer encontrar uma transmissão agora. Público secundário: quem acompanha criadores e quer abrir rapidamente o canal certo.

Objetivos do MVP:

- Buscar transmissões públicas ativas relacionadas a GTA 6.
- Exibir resultados em grade responsiva com canal, título, estado e espectadores opcionais.
- Oferecer busca textual, filtros, ordenação, atualização manual e carregamento incremental.
- Abrir no YouTube e, opcionalmente, incorporar o player oficial.
- Usar cache para reduzir chamadas e proteger a quota.
- Informar limites e falhas de maneira clara.

Fora do MVP: login, chat próprio, comentários, notificações push, ingestão de canais por crawler, retransmissão de vídeos e agregação de Twitch/Kick.

## 3. Requisitos funcionais

### P0, MVP

1. Backend usa YouTube search.list com type=video e eventType=live.
2. Consultas iniciais configuráveis: “GTA 6 live”, “GTA VI live”, “GTA 6 ao vivo”, “GTA 6 gameplay live”, “GTA 6 stream”, “Grand Theft Auto VI live”, “GTA 6 en vivo”.
3. Unir resultados e deduplicar pelo videoId.
4. Buscar detalhes em lote via videos.list e channels.list quando necessário.
5. Exibir última atualização e botão de atualizar com cooldown.
6. Filtros: texto, idioma estimado (pt/en/es/outro), ordenar por relevância, espectadores e recente. Marcar idioma/categoria como estimados.
7. Número de espectadores é opcional. Se não vier, omitir ou mostrar “Não informado”, nunca zero.
8. Botão “Assistir no YouTube” abre nova aba com noopener/noreferrer. Modal de embed é opcional e sempre acionado pela pessoa.
9. Fallback para YouTube quando o embed for bloqueado ou indisponível.
10. Paginação por ação explícita, sem disparar busca ao rolar automaticamente.
11. Estados visuais para loading, vazio, erro temporário, quota excedida, live encerrada e embed indisponível.
12. Rodapé informa que é um projeto independente, sem afiliação à Rockstar, Take-Two ou YouTube.

### P1

Favoritos em localStorage, busca de canal, visualização compacta, compartilhamento de link, tema claro opcional e atualização periódica apenas com a aba visível.

## 4. Design system

Direção: interface noturna, cinematográfica e original. Neon controlado em CTA, dados e estado live. Informação prioritária: título, canal, estado e ação de assistir. Miniaturas em 16:9. Arte de hero original ou licenciada.

| Token | Cor | Uso |
| --- | --- | --- |
| background | #09090D | Fundo |
| surface | #14141B | Cards |
| surface-raised | #1D1D27 | Hover e menus |
| text-primary | #F5F2EF | Texto principal |
| text-secondary | #B6B3BC | Auxiliar |
| accent-pink | #FF3D81 | CTA |
| accent-cyan | #32D8E8 | Dados |
| accent-violet | #A76BFF | Detalhes |
| live-red | #FF3548 | Badge LIVE |
| border | #33323D | Contornos |

Validar contraste antes de publicar.

Tipografia: títulos em Oswald ou Barlow Condensed; interface em Geist Sans ou Inter; números em Geist Mono. Usar fontes com licença compatível, sem depender de fontes proprietárias da franquia.

Movimento:

- Rápido 140 ms, comum 240 ms, destaque até 480 ms.
- Hero: fade e deslocamento curto, uma vez.
- Cards: entrada com fade e movimento até 12 px.
- Hover: elevar no máximo 3 px e realçar borda.
- Ponto LIVE pode pulsar sutilmente, sem piscar texto.
- Modal: fade e escala curta.
- Respeitar prefers-reduced-motion e remover movimentos não essenciais.
- Evitar animação contínua em thumbnails e efeitos que prejudiquem leitura.

Componentes: SiteHeader, HeroSection, RefreshStatus, FilterBar, LiveGrid, LiveCard, LivePlayerDialog, Button, Badge, Skeleton, EmptyState, ErrorState, QuotaState e SiteFooter.

## 5. Arquitetura de dados

Fluxo: navegador chama GET /api/lives; Route Handler valida parâmetros e consulta cache; em cache válido responde sem nova chamada; se vencido, serviço executa buscas, deduplica IDs, carrega detalhes em lote, normaliza dados, atualiza cache e responde com timestamp.

Parâmetros da rota:

- q: termo opcional, máximo 80 caracteres.
- lang: all, pt, en ou es.
- sort: relevance, viewers ou recent.
- pageToken: token de paginação validado.

Modelo normalizado:

```json
{
  "items": [{
    "videoId": "string",
    "title": "string",
    "description": "string",
    "channelId": "string",
    "channelTitle": "string",
    "thumbnailUrl": "string",
    "publishedAt": "ISO-8601",
    "liveStartedAt": "ISO-8601 ou null",
    "concurrentViewers": "number ou null",
    "language": "pt, en, es ou unknown",
    "watchUrl": "string",
    "embedUrl": "string",
    "isLive": true,
    "embedAllowed": "boolean ou unknown"
  }],
  "updatedAt": "ISO-8601",
  "cached": true,
  "stale": false,
  "nextPageToken": "string ou null"
}
```

Modelo ilustrativo. Validar e normalizar campos ausentes. Vídeo pode encerrar entre busca e clique.

### Cache e quota

- TTL padrão 120 segundos; stale cache até 600 segundos se YouTube falhar.
- Produção: Redis/Upstash ou cache gerenciado; memória somente no desenvolvimento.
- Cooldown manual de 30 segundos, rate limit, timeout de 5 a 8 s e retries limitados com backoff.
- Tratar respostas 403/429 e exibir estado de quota quando necessário.
- Confirmar limites e quota atual no Google Cloud Console antes do lançamento. Quota e custo por método podem mudar.
- Não assumir que uma consulta cobre todos os idiomas ou grafias; manter termos configuráveis e ampliar com controle de quota.

### Player incorporado

Usar iframe oficial somente após interação, com title acessível e sem autoplay com som. Mostrar alternativa para youtube.com/watch?v=VIDEO_ID se bloqueado. Considerar consentimento antes de carregar conteúdo de terceiros.

## 6. Stack e estrutura sugerida

Next.js App Router, TypeScript, Tailwind CSS, Route Handler, Zod para validar entradas e cache Redis em produção. Server Components para estrutura inicial; componentes client para filtros, modal, atualizar e favoritos. Animações CSS para casos simples; Motion One ou Framer Motion se necessário. Deploy Node/Vercel.

```
app/
  layout.tsx
  page.tsx
  globals.css
  api/lives/route.ts
  watch/[videoId]/page.tsx
  privacy/page.tsx
  terms/page.tsx
components/
  layout/site-header.tsx
  layout/site-footer.tsx
  lives/live-grid.tsx
  lives/live-card.tsx
  lives/live-card-skeleton.tsx
  lives/live-filters.tsx
  lives/live-player-dialog.tsx
  lives/live-status.tsx
  lives/empty-state.tsx
  lives/error-state.tsx
  lives/quota-state.tsx
  ui/button.tsx
  ui/badge.tsx
  ui/dialog.tsx
  ui/input.tsx
  ui/skeleton.tsx
lib/
  youtube/client.ts
  youtube/searches.ts
  youtube/normalize.ts
  youtube/types.ts
  cache/index.ts
  cache/memory-cache.ts
  cache/redis-cache.ts
  validation/lives-query.ts
  config/site.ts
  config/design-tokens.ts
  utils/format-count.ts
  utils/format-date.ts
  utils/infer-language.ts
hooks/
  use-live-filters.ts
  use-refresh-lives.ts
  use-local-favorites.ts
public/
  fonts/
  images/hero-original.webp
  icons/
```

## 7. Ambiente, segurança e SEO

Variáveis:

- YOUTUBE_API_KEY: segredo só no servidor, nunca prefixar NEXT_PUBLIC_.
- LIVE_CACHE_TTL_SECONDS=120.
- LIVE_STALE_TTL_SECONDS=600.
- LIVE_RATE_LIMIT_SECONDS=30.
- YOUTUBE_DEFAULT_REGION=BR.
- YOUTUBE_DEFAULT_LANGUAGE=pt.
- REDIS_URL ou credenciais do provedor.
- NEXT_PUBLIC_SITE_URL.

Incluir .env.example sem segredos e não commitar .env.local. Validar e limitar paginação e inputs. Exibir apenas metadados públicos retornados pela API; não baixar ou retransmitir vídeos. Respeitar termos do YouTube e regras de incorporação.

SEO:

- Title: “Lives de GTA 6 ao vivo | Radar de Lives”.
- Description: “Encontre transmissões públicas de GTA 6 ao vivo no YouTube.”
- Open Graph com arte original.
- Não declarar evento oficial ou estatística global.

Aviso de marca: “Projeto independente de fãs. Não afiliado à Rockstar Games, Take-Two Interactive ou YouTube. GTA e Grand Theft Auto são marcas de seus respectivos proprietários.” Confirmar nome e domínio antes de lançar.

## 8. Acessibilidade e aceite

Navegação por teclado, foco visível, labels acessíveis, contraste revisado e reduced motion.

Critérios de aceite:

- Chave API nunca chega ao navegador.
- Rota retorna resultados encontrados, timestamp e estado do cache.
- Duplicatas removidas por videoId.
- Falta de espectadores não vira zero.
- Busca, filtros, ordenação, atualizar e carregar mais funcionam.
- Cooldown evita chamadas repetidas.
- Erros, vazio, quota e vídeo indisponível têm estados claros.
- Player é acionado pela pessoa e tem fallback.
- Layout responsivo e navegável por teclado.
- Não afirmar cobertura completa nem afiliação oficial.

## 9. Etapas de construção

1. Fundação: Next, TypeScript, Tailwind, tokens, layout, hero e grade com dados simulados.
2. API: chave, consultas, deduplicação, normalização, paginação, cache e erros.
3. Interações: filtros, ordenação, atualização, player e acessibilidade.
4. Lançamento: cache compartilhado, rate limit, revisão de quota/políticas, SEO, responsividade e telemetria mínima.

Decisões iniciais recomendadas: atualização manual, TTL de 120 s, sem polling agressivo; limite inicial de resultados deve ser configurado no servidor; nome final e provedor de cache podem ser escolhidos durante setup.

## 10. Riscos

| Risco | Tratamento |
| --- | --- |
| Busca não encontra todas as lives | Avisar limite, ampliar consultas controladas e permitir termo livre |
| Quota esgotada | Cache, cooldown, rate limit e dados recentes sinalizados como stale |
| Título menciona GTA 6 sem gameplay | Não prometer classificação perfeita |
| Live acaba após consulta | Timestamp, revalidação e fallback |
| Embed bloqueado | Abrir YouTube |
| Métrica de espectadores ausente | Omitir valor |
| Confusão com marca oficial | Marca e assets próprios, aviso independente |

## 11. Referências

- Rockstar GTA VI: https://www.rockstargames.com/VI
- YouTube search.list: https://developers.google.com/youtube/data/reference/rest/v3/search/list
- YouTube videos.list: https://developers.google.com/youtube/data/reference/rest/v3/videos
- YouTube channels.list: https://developers.google.com/youtube/data/reference/rest/v3/channels
- YouTube Data API: https://developers.google.com/youtube/v3
- Políticas: https://developers.google.com/youtube/terms/developer-policies

Antes de usar em produção, conferir quota, campos disponíveis e políticas nas páginas oficiais atuais.
