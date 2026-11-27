# 045 — Devolver o foco ao card ao fechar o player de uma live encerrada ou indisponível

Issue [#85](https://github.com/darioreisjr/radar-de-lives/issues/85) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Falha B1 do QA (spec 042) · Branch `sprint/045-player-focus-return`

## Contexto

Ao abrir o player, a revalidação (spec 002 D5) atualiza o card na hora (`item-status`). Com `ended` ou `unavailable`, o card passa a "Live encerrada após a busca" e o botão "Assistir aqui" some **enquanto o diálogo ainda está aberto**. Ao fechar, `closePlayer` chama `focus()` num elemento que saiu do DOM, e o foco cai no `<body>` (WCAG 2.4.3). Vale para YouTube e Twitch.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | Se o botão que abriu o player ainda está no DOM (`isConnected`), o foco volta a ele, como hoje. | Live no ar: comportamento atual mantido. |
| D2 | Senão, o foco vai para o link da plataforma no **mesmo card** ("Abrir no YouTube" / "Abrir na Twitch"), localizado pelo id do título (`liveDomId`). | É a ação que sobra no card encerrado; mantém a pessoa no mesmo ponto da lista. |
| D3 | Se nem o card existir mais (ex.: atualização da lista), o foco vai para o título da seção de lives (`#lives-title`, com `tabIndex={-1}`). | Nunca deixar o foco no `<body>`. |

## Critérios de aceite

1. **CA1:** depois de fechar o player de uma live `ended` ou `unavailable`, o foco fica no link da plataforma do card dessa live (YouTube e Twitch).
2. **CA2:** com live no ar, o foco volta ao "Assistir aqui" (sem mudança).
3. **CA3:** e2e cobrindo `ended` e `unavailable` nas duas plataformas.

## Rollback

Reverter o PR.
