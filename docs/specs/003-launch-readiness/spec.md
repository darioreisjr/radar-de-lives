# 003 — Preparação para lançamento

Status: implementada e verificada (ver `tasks.md`) · Data: 2026-11-21
Fonte: [PRD](../../product/PRD_Radar_de_Lives_GTA6.md) §7 (SEO, segurança), §8 (contraste), §9 etapa 4. Continua [002](../002-player-and-states/spec.md).

## 1. Contexto

A Fase 4 do PRD pede: cache compartilhado, rate limit, revisão de quota/políticas, SEO, responsividade e telemetria mínima. A 002 mostrou que as Developer Policies do YouTube exigem política de privacidade própria. O PRD também pede validar contraste antes de publicar.

## 2. Objetivo

Deixar o produto pronto para revisão de lançamento, sem novos serviços pagos: páginas de privacidade e termos que descrevem o comportamento real do site, imagem Open Graph original, contraste verificado por teste, telemetria mínima em logs do servidor e verificação do modo produção.

## 3. Escopo

### Incluído
- `app/privacy/page.tsx` e `app/terms/page.tsx` (caminhos do PRD §6), com conteúdo baseado no que o código faz.
- Links para essas páginas no rodapé e no consentimento do player.
- `app/opengraph-image.tsx` com arte original gerada por código (`next/og`).
- Teste automatizado de contraste WCAG dos pares de cores usados.
- Telemetria mínima: eventos estruturados (JSON por linha) no log do servidor.
- Verificação do build de produção sem chave (estado "não configurada", sem fixtures).

### Excluído
- **Cache compartilhado**: decisão do usuário em 2026-11-21 — "decidir depois". Mantém memória; limitação documentada (§7).
- Teste com chave real: depende da chave do usuário.
- Analytics de terceiros, `robots.ts`/`sitemap.ts` (não pedidos no PRD), cabeçalhos de segurança/CSP.
- Revisão jurídica dos textos.

## 4. Fatos confirmados

| Fonte | Fato |
| --- | --- |
| YouTube Developer Policies (lido na 002) | Política de privacidade obrigatória, acessível a qualquer momento; deve dizer que o cliente usa os YouTube API Services, citar e linkar a Política de Privacidade do Google; linkar os Termos do YouTube (`https://www.youtube.com/t/terms`). |
| Doc embutida Next 16.4 `opengraph-image` | `opengraph-image.tsx` com `ImageResponse` de `next/og` gera a imagem no build (estática). Exporta `alt`, `size`, `contentType`. Só flexbox e um subconjunto de CSS; fontes só ttf/otf/woff; pacote ≤ 500 KB. |
| Código atual | O app não cria contas, não usa cookies próprios, `localStorage` nem analytics. O IP do cliente é usado em memória por até 60 s para rate limit. Miniaturas vêm de `i.ytimg.com` (Google) sem consentimento prévio. O player do YouTube só carrega após consentimento. Fontes são servidas pelo próprio site (`next/font` baixa no build). |

## 5. Decisões (reversíveis)

- **D1 — Textos legais descrevem só o comportamento real** do código. Campos que só o responsável pode definir (nome/entidade responsável, contato, foro) ficam em `siteConfig.legal` como `null`. Enquanto forem `null`, as páginas mostram um aviso visível "Versão preliminar: responsável e contato ainda não definidos". Os textos não são aconselhamento jurídico e precisam de revisão.
- **D2 — Miniaturas são declaradas na política** como requisição direta ao Google. Bloqueá-las até consentimento mudaria a experiência central; fica registrado como ponto para a revisão jurídica.
- **D3 — Imagem OG sem fonte customizada.** Oswald exigiria baixar um arquivo de fonte para o repositório; usamos a fonte padrão do `next/og` e a identidade vem de cores e formas (anéis do radar, horizonte).
- **D4 — Novo token `border-strong` (#6E6B7B)** para contornos de controles de formulário e botões secundários, porque `border` (#33323D) não atinge 3:1 contra o fundo (WCAG 1.4.11). `border` continua em cards e divisores decorativos.
- **D5 — Telemetria mínima em log:** `lib/telemetry.ts` grava JSON por linha (`evt`, `ts`, campos). Eventos: `youtube_call` (método, uso/limite do orçamento), `youtube_error` (código), `budget_exhausted`, `stale_served`, `route_error`. Sem IP, sem chave, sem URL do YouTube. Contadores continuam por processo.
- **D6 — Privacidade linkada no consentimento do player** além do rodapé.
- **D7 — Sem chave em produção, mensagem neutra** ("A busca de lives está indisponível no momento") na API e na UI; instruções de configuração só fora de produção. Achado na verificação de `next start`.
- **D8 — Resumo "Busca indisponível"** quando nenhuma consulta foi concluída, em vez de "0 lives encontradas" (que sugeriria busca feita sem resultados). Achado na verificação.
- **D9 — `NEXT_PUBLIC_SITE_URL` obrigatória no build de produção**: sem ela, `og:image` aponta para `http://localhost:3000` (aviso do Next). Documentada no `.env.example` e no README.
- **D10 — Imagem OG com véu e horizonte rebaixado** para legibilidade (achado ao inspecionar o PNG gerado). `z-index` removido (não suportado pelo `next/og`).

## 6. Requisitos

- **RF1** `/privacy` e `/terms` renderizam estaticamente, com título, data de atualização, seções descritas em D1 e links para Termos do YouTube e Política de Privacidade do Google.
- **RF2** A política informa: uso dos YouTube API Services; dados públicos exibidos; IP em memória para rate limit; miniaturas carregadas do Google; player só após consentimento; ausência de cookies próprios/analytics; logs de hospedagem; contato (ou aviso de pendência).
- **RF3** Os termos informam: projeto independente (aviso do PRD), sem garantia de cobertura ("Lives encontradas"), conteúdo pertence aos criadores, uso do YouTube sujeito aos Termos do YouTube, sem download/retransmissão.
- **RF4** Rodapé com links "Privacidade" e "Termos"; consentimento do player linka `/privacy`.
- **RF5** `/opengraph-image` gera PNG 1200×630 original com alt descritivo; `<meta property="og:image">` presente na home.
- **RF6** Logs de telemetria seguem D5.
- **RNF1** Pares de texto ≥ 4,5:1; contornos de controles e indicadores ≥ 3:1 (teste).

## 7. Riscos e pendências

- **Cache em memória em produção:** com várias instâncias (Vercel/serverless), cada uma tem cache, orçamento e rate limit próprios; a quota de 100 buscas/dia pode ser excedida. Recomendação até a decisão: deploy em **instância única**. Interface `CacheStore` pronta para troca.
- Textos legais exigem revisão e dados do responsável antes de publicar.
- Logs de telemetria dependem do provedor de hospedagem para retenção/consulta.

## 8. Critérios de aceite

1. **CA1** `/privacy` e `/terms` respondem 200 e aparecem como estáticas no build.
2. **CA2** Com `siteConfig.legal` nulo, ambas mostram o aviso de versão preliminar.
3. **CA3** A política contém os links `https://policies.google.com/privacy` e `https://www.youtube.com/t/terms` e menciona "YouTube API Services".
4. **CA4** Home inclui `og:image` apontando para `/opengraph-image…`; a rota responde `image/png` 1200×630.
5. **CA5** Teste de contraste passa para todos os pares listados.
6. **CA6** Telemetria: teste confirma eventos `youtube_call` e `stale_served` e que nenhum evento contém a chave.
7. **CA7** `next start` sem chave mostra "Busca no YouTube não configurada" e nenhum card simulado.
8. **CA8** lint, typecheck, testes e build passam.
