# 005 — Estado compartilhado no Upstash Redis (deploy na Vercel)

Status: implementada e verificada (ver `tasks.md`) · Data: 2026-11-21
Fonte: decisão do usuário em 2026-11-21 (hospedagem **Vercel + Upstash Redis**); PRD §5 "Cache e quota" ("Produção: Redis/Upstash… memória somente no desenvolvimento").

## 1. Contexto

Cache, orçamento diário de quota, rate limit e controle de concorrência ficam na memória do processo (001–003). Na Vercel (serverless) cada instância teria seus próprios contadores: a quota de 100 `search.list`/dia poderia ser ultrapassada e o rate limit seria ineficaz.

## 2. Objetivo

Com Upstash configurado, todo estado que protege a quota é compartilhado entre instâncias. Sem Upstash (desenvolvimento local), tudo continua em memória, sem mudança de comportamento.

## 3. Fatos confirmados

| Fonte | Fato |
| --- | --- |
| npm `@upstash/redis` | Versão 1.41.0, publicada em 2026-11-02. Cliente HTTP (sem conexão persistente), indicado para serverless/Next.js. |
| Código-fonte instalado (`nodejs.js`) | `Redis.fromEnv()` lê `UPSTASH_REDIS_REST_URL` **ou** `KV_REST_API_URL`, e `UPSTASH_REDIS_REST_TOKEN` **ou** `KV_REST_API_TOKEN`. |
| Tipos instalados | `set(key, value, { nx, px, ex… })` devolve `"OK"` ou `null` (NX não aplicado). `retry` padrão: 5 tentativas, backoff `exp(n)*50` ms. Aceita `signal` (função → `AbortSignal`). Telemetria do SDK ligada por padrão (`enableTelemetry`). |
| Docs Upstash | `set` serializa não-strings com `JSON.stringify`; `incr` inicializa chave ausente em 0; `pipeline` não é atômico; `multi` é atômico. |
| Docs Vercel/Upstash | Integração do Marketplace injeta as variáveis no projeto; as páginas **não** listam os nomes (por isso aceitamos os dois pares). Vercel KV foi migrado para Upstash em dez/2024. |
| Preço Upstash (free) | 500 mil comandos/mês, 256 MB, 10 MB por requisição. |

## 4. Decisões

- **D1 — Três primitivas de armazenamento** atrás de interfaces: `CacheStore` (já existia), `Counter.incr(key, ttl)` e `Lock.acquire(key, ttl)`. Implementações em memória e Upstash. Escolha automática: Upstash se URL e token existirem; senão memória.
- **D2 — Contador com TTL sem corrida**: `SET key 0 NX PX ttl` e depois `INCR` (o `INCR` preserva o TTL). Duas chamadas, mas a chave nunca fica sem expiração.
- **D3 — Trava substitui "último acesso" e single-flight entre instâncias**: antes de chamar o YouTube, `SET lock:<página> NX PX <LIVE_RATE_LIMIT_SECONDS>`. Quem não obtém a trava aguarda até ~3 s por um cache novo; se não vier, serve o cache existente ou responde `upstream_unavailable`. O single-flight em memória continua dentro de cada instância.
- **D4 — Orçamento diário e rate limit viram contadores compartilhados**: `budget:<método>:<dia PT>` (TTL 2 dias) e `rl:<id>:<janela>` (TTL = janela).
- **D5 — IP não vai para o Upstash**: o rate limit usa `HMAC-SHA256(IP)` truncado. Chave do HMAC: `RATE_LIMIT_SECRET` se definida; senão o token do Upstash (secreto e igual em todas as instâncias). Política de privacidade atualizada.
- **D6 — Falhas do Upstash**: leitura de cache, orçamento ou trava falham **fechado** (`upstream_unavailable`, sem chamar o YouTube, para não estourar quota). Rate limit falha **aberto** (só protege abuso). Gravação de cache que falha não impede a resposta. Tudo gera `store_error` na telemetria.
- **D7 — Cliente Upstash**: `retry` 2 tentativas (50/100 ms), timeout de 2 s por chamada, `enableTelemetry: false`.
- **D8 — Aviso em produção sem Upstash**: em `NODE_ENV=production` com `VERCEL` definido e sem Upstash, registra `store_memory_in_production` uma vez por instância. Não bloqueia.
- **D9 — Prefixo de chaves** `radar:v1:` para permitir migração futura.
- **D10 — Sem nova dependência de rate limit** (`@upstash/ratelimit`): o contador de janela fixa basta.

## 5. Requisitos

- **RF1** Com `UPSTASH_REDIS_REST_URL`/`TOKEN` (ou `KV_REST_API_URL`/`TOKEN`), cache de páginas, cache de revalidação, orçamentos, rate limit e trava usam Upstash.
- **RF2** Sem essas variáveis, comportamento idêntico ao atual (memória).
- **RF3** Duas instâncias com o mesmo store não fazem duas buscas no YouTube dentro de `LIVE_RATE_LIMIT_SECONDS`.
- **RF4** O orçamento diário é único para todas as instâncias.
- **RF5** Nenhum IP em texto claro é gravado no store.
- **RF6** `.env.example` e README documentam as variáveis e o passo a passo na Vercel.

## 6. Critérios de aceite

1. **CA1** Contador: incrementa, expira após o TTL e mantém TTL desde o primeiro incremento (teste com fake Redis).
2. **CA2** Duas instâncias do serviço sobre o mesmo store: N requisições simultâneas → 1 `search.list` (teste).
3. **CA3** Orçamento compartilhado: limite 1 dividido por duas instâncias → segunda busca recebe `quota_exceeded` (teste).
4. **CA4** Rate limit compartilhado entre instâncias e chave sem o IP em claro (teste).
5. **CA5** Falha do store na leitura de cache → `upstream_unavailable` sem chamada ao YouTube; falha no rate limit → requisição permitida (teste).
6. **CA6** Adaptador Upstash: envia `nx`/`px` corretos e trata `null` do `SET NX` (teste com cliente simulado).
7. **CA7** Sem variáveis Upstash, a suíte anterior continua verde e o app local funciona.
8. **CA8** lint, typecheck, testes, build; chave e token não aparecem em `.next/static`.

## 7. Fora do escopo / pendências do usuário

- Criar o banco Upstash (Marketplace da Vercel) e o projeto na Vercel; configurar variáveis e DNS.
- Teste contra um Upstash real: depende das credenciais do usuário.
