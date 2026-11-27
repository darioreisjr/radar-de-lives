# 055 — Foco ao fechar o player sem estado intermediário

Issue [#102](https://github.com/darioreisjr/radar-de-lives/issues/102) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Falha B3 do QA (spec 054) · Complementa a spec 045 (#85) · Branch `sprint/055-player-focus-race`

## Contexto

No QA da spec 054, ao fechar com `Esc` o player de uma live encerrada ou indisponível, o foco foi lido no botão "Fechar player", dentro do diálogo já fechado, em 4 de 36 repetições.

## Causa (instrumentada em 2026-11-27)

Eventos registrados na página depois do `Esc`, num caso "ruim":

| ms | Evento |
|---|---|
| 0 | foco em "Fechar player" |
| 10 | `cancel`: o `<dialog>` fecha e some da tela |
| 94 | foco vai para "Abrir na Kick" (`closePlayer`, spec 045) |
| 96 | o diálogo sai do DOM; evento `close` |

O foco **termina** no lugar certo, mas só quando chega o evento `close`, que o navegador entrega numa tarefa separada — até ~100 ms depois com a página ocupada. Nesse intervalo, o foco fica num botão de um diálogo invisível. Quando a live encerrou, o botão que abriu o diálogo já saiu do card, então o fechamento nativo não consegue devolver o foco a ele. A hipótese da issue (ordem entre o fechamento nativo e o `closePlayer`) se confirmou; a de o diálogo continuar montado não.

Os testes da spec 045 passavam porque `toBeFocused` espera até o foco chegar.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | `Esc` (`onCancel`): `preventDefault`, fecha o diálogo e avisa o pai **na mesma tarefa**. | Elimina o intervalo: o `closePlayer` devolve o foco antes de qualquer outra coisa. |
| D2 | O botão "Fechar player" usa o mesmo `requestClose`. | Mesmo caminho para os dois jeitos de fechar. |
| D3 | `onClose` continua avisando o pai, uma vez só (`closedRef`), para outros fechamentos. | Nenhum caminho perde o aviso nem avisa duas vezes. |
| D4 | O `closePlayer` (spec 045) não muda. | A lógica de destino do foco estava certa; o problema era o momento. |

## Critérios de aceite

1. **CA1:** logo depois do `Esc` (na mesma tarefa), o foco já está no card: "Assistir aqui" com live no ar, "Abrir na <plataforma>" com live encerrada ou indisponível.
2. **CA2:** o cenário da issue repetido 50 vezes sem falha, nos dois perfis.
3. **CA3:** os testes de foco da spec 045 e de teclado continuam verdes.

## Riscos e rollback

Rollback: reverter o PR (volta o intervalo de ~100 ms, sem erro funcional).
