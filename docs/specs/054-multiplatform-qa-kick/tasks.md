# 054 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente · [!] falha encontrada

- [x] T1 Build local (porta 3100) sem chave do YouTube; `/api/*`, miniaturas (inclusive `images.kick.com` e `web.kick.com`) e players (inclusive `player.kick.com`) respondidos no navegador.
- [x] T2 Roteiro Playwright temporário em 360, 768 e 1280 px; capturas inspecionadas em 2026-11-27. Scripts apagados, fora do commit (D2).
- [x] T3 Smoke em produção (`radardelives.darioreis.dev`), só leitura, em 360 e 1280 px.
- [x] T4 Uma falha registrada abaixo e aberta como issue ligada ao #28: B3 → [#102](https://github.com/darioreisjr/radar-de-lives/issues/102). (CA2)
- [ ] T5 Leitor de tela real (NVDA): item manual para o responsável (como na spec 042).

## Resultados (CA1)

### Estados (simulados; iguais em 360, 768 e 1280 px; sem rolagem horizontal)

| # | Estado | Observado | Resultado |
|---|---|---|---|
| 1 | Três plataformas | "9 lives encontradas"; ordem `y t k y t k y t k`; radar "YouTube 3 · Twitch 3 · Kick 3" | OK |
| 2 | Kick fora | 6 lives (YouTube e Twitch); aviso `role="status"` de resultado parcial; radar "Kick 0" | OK |
| 3 | Só a Kick responde | 3 lives da Kick; aviso parcial; radar "YouTube 0 · Twitch 0 · Kick 3" | OK |
| 4 | Kick com cache vencido | aviso "Uma das plataformas não respondeu agora. Mostrando resultados salvos…" | OK |
| 5 | Vazio | "0 lives encontradas" e o painel honesto | OK |
| 6 | Erro total | "Busca indisponível" | OK |

### Filtros (simulados; iguais em 360 e 1280 px)

| Combinação | Observado | Resultado |
|---|---|---|
| Opções de "Plataforma" | Todas, YouTube, Twitch, Kick | OK |
| Kick | "3 de 9"; 3 selos "Kick"; **nenhum** selo "Conteúdo adulto" (D-K1) | OK |
| Kick + Espectadores | 6 (15 mil) → 3 (4 mil) → 9 (70) | OK |
| Kick + Português | só a Kick 3 | OK |
| YouTube + Espanhol | só a live 7 | OK |
| Todas + Espectadores | Kick 6, Twitch 2, Kick 3, YouTube 1 (ordem mista por público) | OK |

### Player da Kick (simulado)

| Caso | 360 px | 768 px | 1280 px | Resultado |
|---|---|---|---|---|
| `live` | consentimento "O player é carregado da Kick… Política de Privacidade da Kick", **sem aviso de login**; iframe `player.kick.com/canal-kick-6?autoplay=false&muted=true` (322×200) | iframe 730×411 | iframe 960×540 | OK (sem tamanho mínimo: abre também em 360 px) |
| `ended` | "Esta live terminou… A Kick pode ter a gravação"; sem iframe; link | idem | idem | OK |
| `unavailable` | "Vídeo indisponível"; sem iframe; link | idem | idem | OK |
| `Esc` com live no ar | foco no "Assistir aqui" | idem | idem | OK |
| `Esc` com `ended`/`unavailable` | foco no "Abrir na Kick" | idem | **às vezes fica no "Fechar player" ou no `<body>`** | **Falha B3** |

### Acessibilidade

| Item | Observado | Resultado |
|---|---|---|
| Foco visível no filtro "Plataforma" | contorno sólido de 2 px | OK |
| Anúncios | resumo `aria-live="polite"`; aviso parcial `role="status"`; erro `role="alert"` | OK |
| Movimento reduzido | `rise`, `card-in` e `live-pulse` com `1e-05s`, 1 iteração, nas três larguras | OK |

### Produção (2026-11-27, dados reais, só leitura)

| Item | 360 px | 1280 px | Resultado |
|---|---|---|---|
| Lista | 247 lives; radar "YouTube 50 · Twitch 97 · Kick 100" | idem | OK |
| Textos | hero "no YouTube, na Twitch e na Kick"; rodapé "…YouTube, Twitch ou Kick." | idem | OK |
| Filtro "Kick" | "100 de 247"; nenhum selo adulto; miniatura carregada | idem | OK |
| Player real da Kick | consentimento da Kick sem aviso de login → iframe `player.kick.com/iceposeidon?autoplay=false&muted=true`, com o player da Kick e o botão de play (captura) | idem | OK |
| CSP | nenhuma violação | nenhuma violação | OK |
| Rolagem horizontal | não | não | OK |

## Falha encontrada

- **B3: o foco às vezes não volta ao card ao fechar o player de uma live encerrada ou indisponível** (severidade baixa; acessibilidade; regressão intermitente da correção da spec 045, #85). Issue [#102](https://github.com/darioreisjr/radar-de-lives/issues/102).
  - Passos: grade com várias lives (9, três plataformas), 1280 px; "Assistir aqui" numa live cuja revalidação responde `ended` ou `unavailable`; `Esc` cerca de 400 ms depois de abrir.
  - Esperado: foco no "Abrir na <plataforma>" do card (spec 045 D2).
  - Observado: em 4 de 36 repetições (todas em 1280 px), o foco ficou no botão "Fechar player" **dentro do diálogo já fechado** (3 vezes) ou no `<body>` (1 vez). Num cenário menor (5 lives, `Esc` com atraso de 0 a 1000 ms), 30 de 30 corretas.
  - Provável relação com a falha intermitente de `toBeFocused` vista uma vez na spec 049.
  - Hipótese a investigar na issue: ordem entre o fechamento nativo do `<dialog>` (que devolve o foco ao elemento que o abriu, já removido) e o `closePlayer`, ou o diálogo continuar montado por um instante depois do `close`.

## Observações

- **O1** No build local, os textos citam só o YouTube (o servidor local não tem a Kick ativa); em produção citam as três (verificado).
- **O2** O player da Kick mostra "Visit KICK for HD quality": o embed tem qualidade limitada pela própria Kick (spec 020, P3).
