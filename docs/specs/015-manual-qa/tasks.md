# 015 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente · [!] bug encontrado

- [x] T1 Servidor local sem chave; API, miniaturas e player simulados; nenhuma chamada ao Google
- [x] T2 Capturas dos 9 casos em desktop (1280 px) e 375 px, inspecionadas em 2026-11-23
- [x] T3 Movimento reduzido medido nas duas larguras
- [!] T4 Bug B1 registrado abaixo e proposto como tarefa nova (spec 018)

## Resultados (CA1)

| # | Estado | Simulação | Esperado | Observado (desktop e 375 px) | Resultado |
| --- | --- | --- | --- | --- | --- |
| 1 | Quota esgotada | `/api/lives` → 503 `quota_exceeded` | Painel "Limite de consultas atingido", sem cards, radar indisponível | Painel com a mensagem e a explicação da quota; resumo "Busca indisponível"; radar "Busca indisponível no momento", sem pulso vermelho; layout íntegro em 375 px | OK (obs. O1) |
| 2a | Erro do YouTube, sem itens | 502 `upstream_unavailable` | Painel de erro com "Tentar novamente" | Painel com faixa vermelha, mensagem e botão; nova tentativa carrega a lista (teste e2e) | OK (obs. O2) |
| 2b | Erro do YouTube, com itens | 200 e depois 502 ao "Atualizar" | Grade mantida e aviso | "Não foi possível atualizar: … Mostrando os resultados anteriores."; 6 cards mantidos; botão em cooldown "30s" | OK |
| 3 | Dados antigos | 200 com `stale: true`, `cached: true` | Aviso de dados salvos | "O YouTube não respondeu agora. Mostrando resultados salvos da última consulta…"; "· do cache" no horário; grade e radar normais | OK |
| 4 | Lista vazia | 200 com `items: []` | Estado vazio honesto | "0 lives encontradas"; painel "Nenhuma live encontrada agora" explicando que a busca não cobre tudo; radar "0 lives no ar" e "Nenhum canal informou o público" | OK |
| 5 | Player: live encerrada | `/api/lives/<id>` → `state: "ended"` | Mensagem, sem iframe, link para o YouTube | Selo "Encerrada", "Esta live terminou", botão rosa "Abrir no YouTube"; sem iframe; card passa a "Live encerrada após a busca" | OK |
| 6 | Player: agendada | `state: "upcoming"` | Mensagem de agendada | "Ainda não começou / O YouTube informa esta transmissão como agendada."; sem iframe. **Selo do diálogo mostra "Encerrada"** | **Bug B1** |
| 7 | Player: indisponível | `state: "unavailable"` | Mensagem de indisponível | "Vídeo indisponível" com explicação; sem iframe. Selo também "Encerrada" | **Bug B1** |
| 8 | Player: incorporação bloqueada | `state: "live"`, `embedAllowed: false` | Mensagem, sem iframe | Selo "Ao vivo" com "4.321 espectadores agora"; "Player indisponível aqui"; "Abrir no YouTube" | OK |
| — | Player: consentimento (referência) | `state: "live"` | Aviso do Google e "Carregar player" | Texto com links para a Política do Google e a nossa; "Carregar player"; iframe só depois do clique (teste e2e) | OK |
| 9 | Movimento reduzido | `emulateMedia({ reducedMotion: "reduce" })` | Cards, hero e diálogo sem animação; pulso parado | `matchMedia` = `true`. Card `card-in`, hero `rise`, pulso `live-pulse` e diálogo `dialog-in`: duração `1e-05s` (0,01 ms), 1 iteração, transições `1e-05s`. Igual nas duas larguras | OK |

Sem rolagem horizontal em 375 px em nenhum caso (também coberto pelo e2e da spec 014).

## Bug encontrado

- **B1 — Selo errado no player para `upcoming` e `unavailable`** (severidade baixa).
  - Onde: `components/lives/live-player-dialog.tsx`; o selo usa só `live ? <LiveBadge/> : <Badge>Encerrada</Badge>`.
  - Efeito: uma transmissão agendada aparece como "Encerrada" ao lado de "Ainda não começou".
  - Proposta: tarefa nova `018-player-status-badge` com selo "Agendada" para `upcoming` e "Indisponível" para `unavailable`, mais teste e2e. Na prática é raro: a busca só retorna lives em andamento, então `upcoming` depois disso quase não ocorre.

## Observações (não são bugs)

- **O1** No estado de quota, o botão "Atualizar" continua habilitado (fora do cooldown). Clicar não gasta quota: o servidor recusa pelo orçamento diário. Comportamento aceitável.
- **O2** No estado de erro, "Tentar novamente" é rosa (`variant="primary"`), então há dois botões rosa na tela (com "Ver lives encontradas"). É a ação principal desse estado; mantido.
