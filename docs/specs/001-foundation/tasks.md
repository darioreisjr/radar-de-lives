# 001 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente · [!] bloqueado
Última atualização: 2026-11-22

## Base
- [x] T1 Scaffold Next 16.4.6 (npm) + `zod@^4.6.7`, `vitest@^5.1.1`; scripts `typecheck` e `test` — CA14
- [x] T2 PRD e skill SDD salvos no repositório; spec/plan/tasks; README, CLAUDE.md

## Identidade visual
- [x] T3 Tokens do PRD em `@theme`, Oswald/Geist/Geist Mono, animações CSS, reduced motion — CA12
- [x] T4 Header, hero com arte SVG original + véu de legibilidade, footer com aviso de marca — CA1, CA11

## Domínio e API
- [x] T5 Validação Zod de `q/lang/sort/pageToken`, parâmetros extras e repetidos — CA4 (testes + curl)
- [x] T6 Normalização, deduplicação, idioma estimado, entidades HTML — CA5, CA6 (testes)
- [x] T7 Cache em memória + stale + single-flight + intervalo mínimo — CA7, CA8 (testes)
- [x] T8 Cliente YouTube: timeout 8 s, 1 retry só rede/5xx, mapeamento de erros sem vazar chave — CA7 (testes)
- [x] T9 Orçamento diário de search.list (fuso PT) e rate limit 30/min/IP — D2, D6 (testes + curl: 429 + Retry-After)
- [x] T10 Route Handler `/api/lives` + `.env.example` — CA2 (curl: 503 missing_api_key), CA10

## UI interativa
- [x] T11 Status, filtros, grade, cards, skeleton, "Carregar mais" — CA1, CA6, CA9
- [x] T12 Estados vazio/erro/quota/stale/sem chave + fixtures rotuladas — CA3
- [x] T13 Teclado: skip link, labels, ordem de foco, landmarks — CA13

## Verificação (resultados reais)
- [x] T14 `npm run lint` ok · `npm run typecheck` ok · `npm test` 33/33 · `npm run build` ok — CA14
- [x] T15 Build com chave fictícia: 0 ocorrências em `.next` — CA10
- [x] T16 Chrome: desktop (1568 px) e 375 px via iframe; sem rolagem horizontal; filtro "2 de 8"; cooldown desativa o botão — CA1, CA9

## Não verificado / limitações desta fatia
- [x] Chamada real ao YouTube — feita: spec 004 §2 (50 itens reais) e logs de produção na spec 005 ("Deploy em produção"). (Fechado em 2026-11-22, spec 011.)
- [ ] `prefers-reduced-motion` emulado no navegador: verificada só a regra no CSS compilado. → S-10 do `sprint.md`
- [x] Contraste medido com ferramenta — feito: `tests/contrast.test.ts` (spec 003 T2). (Fechado em 2026-11-22, spec 011.)
- [ ] Estados quota/erro/stale vistos na UI real: cobertos por lógica e testes de serviço, não por captura de tela. → S-10 do `sprint.md`
- [x] Modo produção (`next start`) sem chave — feito: spec 003 T7 (home com "Busca indisponível", sem cards simulados). (Fechado em 2026-11-22, spec 011.)

## Decisões pendentes do usuário
- [x] TTL definido em 900 s pelo usuário (D3) — padrão em `lib/config/server-env.ts` e `.env.example`.
- [x] Cache compartilhado em produção — feito: spec 005 (Upstash Redis). (Fechado em 2026-11-22, spec 011.)
- [x] Nome final e domínio — decidido: `radardelives.darioreis.dev` (`siteConfig.url` em `lib/config/site.ts`). (Fechado em 2026-11-22, spec 011.)

## Próxima fatia — 002-player-and-states (iniciada; ver docs/specs/002-player-and-states)
1. `LivePlayerDialog` com iframe oficial (`youtube.com/embed`, ver 002 D2) só após clique, `title` acessível, sem autoplay com som, foco preso e Esc.
2. Fallback "Abrir no YouTube" quando `embedAllowed === false` ou o player falhar; estado "live encerrada / embed indisponível".
3. Revalidação pontual do vídeo ao abrir o player (`videos.list`, 1 unidade) para detectar live encerrada.
4. Testes de UI dos estados quota/erro/stale (React Testing Library ou Playwright — decidir dependência).
