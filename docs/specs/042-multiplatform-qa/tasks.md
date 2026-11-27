# 042 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente · [!] falha encontrada

- [x] T1 Build local (porta 3100) sem chave do YouTube; `/api/*`, miniaturas e players simulados no navegador (mocks de `e2e/support.ts`).
- [x] T2 Roteiro Playwright temporário (17 casos) em 360, 768 e 1280 px; 38 capturas inspecionadas em 2026-11-27. Script apagado, fora do commit (D2).
- [x] T3 Smoke em produção (`radardelives.darioreis.dev`), só leitura, em 360 e 1280 px.
- [x] T4 Duas falhas registradas abaixo e abertas como issues ligadas ao #28: B1 → [#85](https://github.com/darioreisjr/radar-de-lives/issues/85), B2 → [#86](https://github.com/darioreisjr/radar-de-lives/issues/86). (CA2)
- [ ] T5 Leitor de tela real (NVDA): item manual para o responsável (D4).

## Resultados (CA1)

### Estados (simulados; iguais em 360, 768 e 1280 px; sem rolagem horizontal)

| # | Estado | Simulação | Observado | Resultado |
|---|---|---|---|---|
| 1 | Carregando | `/api/lives` segurada | Grade "Carregando lives" com esqueletos; depois a lista | OK |
| 2 | Misto | 4 YouTube + 4 Twitch, `sources` ok | "8 lives encontradas"; selos de plataforma; radar "YouTube 4 · Twitch 4", idiomas e maior público | OK |
| 3 | Parcial: Twitch fora | `sources.twitch.ok=false` | Aviso `role="status"` "Algumas plataformas estão indisponíveis agora…"; 4 cards; radar "Twitch 0" | OK |
| 4 | Parcial: YouTube fora | `sources.youtube.ok=false` | Mesmo aviso; 4 cards da Twitch; radar "YouTube 0" | OK |
| 5 | Cache vencido | `stale: true` no topo (como o agregador faz) | Aviso `role="status"` "Uma das plataformas não respondeu agora. Mostrando resultados salvos…" | OK |
| 6 | Vazio | `items: []`, as duas ok | "0 lives encontradas"; painel "Nenhuma live encontrada agora", sem prometer "todas"; radar zerado | OK |
| 7 | Erro total | 502 `upstream_unavailable` | "Busca indisponível"; painel de erro; radar "Busca indisponível no momento" | OK (obs. O1) |

### Filtros (simulados; iguais nas três larguras)

| Combinação | Esperado | Observado | Resultado |
|---|---|---|---|
| Opções de "Plataforma" | Todas, YouTube, Twitch | Idem | OK |
| Twitch | 4 de 8 | "4 de 8 lives encontradas" | OK |
| Twitch + Inglês | 2 lives (2 e 6) | "2 de 8"; Twitch 2 e Twitch 6 | OK |
| Twitch + Inglês + Espectadores | 6 (15 mil) antes de 2 (9 mil) | Idem | OK |
| YouTube + Português + Mais recentes | 1 antes de 7 | Idem | OK |
| Twitch + Espanhol | só a 8 | Idem | OK |
| Texto sem resultado | Painel com "Limpar filtros" | "Nenhum resultado com esses filtros… Ajuste o texto, o idioma ou a plataforma." | OK |
| Limpar filtros | Volta a 8 e "Todas" | Idem | OK |
| Selo "Conteúdo adulto" | Só no card adulto | Só na Twitch 2 | OK |

### Player da Twitch (simulado)

| Caso | Largura | Observado | Resultado |
|---|---|---|---|
| `live` | 768 e 1280 | Aviso de privacidade da Twitch e "Carregar player"; iframe `player.twitch.tv/?channel=…&parent=127.0.0.1&autoplay=false&muted=true`; link "Abrir na Twitch" | OK |
| `live` | 360 | "Tela estreita para o player" (mínimo 400×300 da Twitch); só o link "Abrir na Twitch" | OK |
| `ended` | todas | Selo "Encerrada", "Esta live terminou… A Twitch pode ter a gravação", link; sem iframe | OK |
| `unavailable` | todas | Selo "Indisponível", "Vídeo indisponível", link; sem iframe | OK |
| `Esc` com live no ar | todas | Fecha e devolve o foco ao "Assistir aqui" | OK |
| `Esc` com `ended`/`unavailable` | todas | Fecha, mas o foco vai para o `<body>` (YouTube e Twitch) | **Falha B1** |

### Acessibilidade

| Item | Observado | Resultado |
|---|---|---|
| Ordem do `Tab` | Pular para as lives → cabeçalho → hero → Atualizar → busca → Plataforma → Idioma → Ordenar → cards ("Assistir aqui" e link da plataforma) → rodapé | OK |
| Foco visível | Contorno sólido de 2 px ciano (`rgb(50, 216, 232)`) no filtro "Plataforma"; igual nos demais | OK |
| Anúncios | Resumo em `aria-live="polite"` ("8 lives encontradas", "4 de 8…"); avisos parcial e de cache em `role="status"`; erro em `role="alert"` | OK |
| Cards | Público com texto para leitor de tela e versão visual `aria-hidden` (sem leitura duplicada); links com "(abre em nova aba)" | OK |
| Movimento reduzido | `matchMedia` = `true`; `rise`, `card-in` e `live-pulse` com `1e-05s`, 1 iteração, nas três larguras | OK |
| Tema claro | Não se aplica: o site só tem tema escuro (D3) | — |
| NVDA | Não executado pelo agente (D4) | Pendente (T5) |

### Produção (2026-11-27, dados reais, só leitura)

| Item | 360 px | 1280 px | Resultado |
|---|---|---|---|
| Lista | 147 lives (50 YouTube + 97 Twitch) | 149 (50 + 99) | OK |
| Textos | Hero "no YouTube e na Twitch… na plataforma de origem"; nota de cobertura com as duas APIs | Idem | OK |
| Filtro "Twitch" | "97 de 147" | "99 de 149" | OK |
| Selo adulto | 4 cards | 3 cards | OK |
| Player da Twitch | "Tela estreita para o player" + link | Aviso de privacidade → iframe com `parent=radardelives.darioreis.dev`; **a Twitch exige login** | **Falha B2** |
| `Esc` | Foco volta ao "Assistir aqui" | Idem | OK |
| CSP | Nenhuma violação | Nenhuma violação | OK |
| Rolagem horizontal | Não | Não | OK |

## Falhas encontradas

- **B1: foco perdido ao fechar o player de uma live encerrada ou indisponível** (severidade baixa; acessibilidade; YouTube e Twitch). Issue [#85](https://github.com/darioreisjr/radar-de-lives/issues/85).
  - Passos: abrir "Assistir aqui" num card; a revalidação responde `ended` (ou `unavailable`); fechar com `Esc`.
  - Esperado: o foco volta ao card (WCAG 2.4.3).
  - Observado: `document.activeElement` é o `<body>`. O card troca para "Live encerrada após a busca" e o botão "Assistir aqui", que era o alvo do foco, deixa de existir (`components/lives/live-explorer.tsx`, `triggerRef.current?.focus()`).
  - Existe desde a spec 015/018 (não foi coberto pelo e2e); não é da Twitch.
- **B2: o player embutido da Twitch pede login em todas as lives de GTA 6** (severidade alta para a experiência; Twitch). Issue [#86](https://github.com/darioreisjr/radar-de-lives/issues/86).
  - Passos: em produção, desktop, sem sessão na Twitch, filtrar "Twitch", "Assistir aqui", "Carregar player".
  - Observado: o iframe oficial mostra "O conteúdo de <canal> é destinado a públicos específicos. Pode conter: Jogo apenas para adultos. Você deve entrar ou criar uma conta para continuar." Testado em 5 canais (posições 1, 6, 16, 31 e 61; en e es): os 5 bloqueados.
  - Causa: GTA 6 tem o rótulo `MatureGame` na Twitch, e o player embutido exige uma conta logada para esse rótulo. Pela decisão do PRD D6, `MatureGame` sozinho não gera o selo "Conteúdo adulto", então o card não avisa.
  - Efeito: para quem não está logado na Twitch neste navegador (e com cookies de terceiros bloqueados, o que é cada vez mais comum), o player embutido da Twitch não toca nenhuma live. O link "Abrir na Twitch" funciona.
  - Decisão do responsável (2026-11-27): **manter o player, com aviso** de que a Twitch pode pedir login (opção 2).

## Observações (não são falhas)

- **O1** No erro total, o radar diz "quando a consulta ao YouTube responder" no build local, que só tem o YouTube configurado no servidor. Em produção, com as duas plataformas, o texto é "a busca" (spec 034 D5).
- **O2** Os textos do hero no build local citam só o YouTube pelo mesmo motivo; em produção citam as duas (verificado).
