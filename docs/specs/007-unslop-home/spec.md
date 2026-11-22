# 007 — Unslop da home (polimento dentro do PRD)

Status: implementada e verificada · Data: 2026-11-21
Fonte: pedido do usuário ("aplica o unslop na home"), skill `unslop` (Damir Sokolovsky, CC BY 4.0) e decisões do usuário em 2026-11-21: **polimento dentro do PRD** e **painel do radar com dados reais** no hero.

## 1. Auditoria (sinais encontrados)

| Grupo | Sinal | Onde |
| --- | --- | --- |
| Cor | Texto em gradiente rosa→violeta | `hero-section.tsx` ("no radar") |
| Cor | Manchas radiais violeta/ciano, grão de filme, véu | `hero-section.tsx`, `globals.css .film-grain` |
| Cor | Sol em gradiente rosa→violeta | arte SVG do hero |
| Cor | Sombra rosa no hover dos cards | `live-card.tsx` |
| Cor | Acento em tudo: botão rosa cheio em cada um dos 50 cards | `live-card.tsx` |
| Cor | Gradientes violeta no placeholder de miniatura e na marca | `live-card.tsx`, `radar-mark.tsx` |
| Tipo | Títulos 700 em caixa alta (Oswald) | hero, resumo, estados, rodapé, placeholder |
| Tipo | Rótulos em maiúsculas com tracking largo | eyebrow do hero, filtros, selos, wordmark, rodapé |
| Composição | Arte decorativa que não mostra o produto; faixa vazia à direita do hero | `hero-section.tsx` |
| Cópia | Aviso de cobertura repetido no hero e acima da grade | `hero-section.tsx`, `live-explorer.tsx` |
| Detalhes | Tamanhos soltos `text-[11px]`; selos em pílula | `badge.tsx` |

Mantidos (não são slop): ponto "ao vivo" pulsando (está de fato ao vivo), animações curtas, foco visível, grade 16:9, cópia sem exclamações.

## 2. Direção

- **Produto:** lista as lives de GTA 6 que estão no ar agora no YouTube, para quem quer achar uma transmissão rápido.
- **Caráter:** atento, noturno, direto.
- **Mundo:** sala de controle de transmissão de madrugada — monitores, o vermelho do "no ar", leituras de instrumento.
- **Momentos:** as miniaturas das lives (parede de monitores) e o painel do radar no hero com números reais da busca.
- **Assinatura:** o ponto vermelho "ao vivo", só onde algo está realmente no ar.

## 3. Decisões

- **D1 — Dentro do PRD:** tokens de cor mantidos (rosa = ação principal, ciano = dados, vermelho = ao vivo). Violeta deixa de ser usado na home. Oswald só no título do hero e das páginas legais, peso 500, sem caixa alta.
- **D2 — Uma ação rosa por tela:** "Ver lives encontradas" no hero. Nos cards, "Assistir aqui" e "YouTube" viram secundários neutros.
- **D3 — Painel do radar:** usa os itens já carregados pela grade (mesma consulta, sem quota extra): total encontrado, distribuição por idioma estimado, maior público informado e horário da atualização. Sem dados inventados; estados de carregamento, indisponível e simulado.
- **D4 — Estado compartilhado:** o estado da grade sobe para um provider cliente (`LivesProvider`) usado pelo hero e pela grade; o reducer puro (`explorer-state.ts`) não muda.
- **D5 — Sentence case** em títulos, rótulos e selos; texto pequeno sem tracking; números `tabular-nums`.
- **D6 — Hover sem cor:** cards ganham só um degrau de superfície/borda e no máximo 2 px de elevação (dentro do limite de 3 px do PRD).
- **D7 — Páginas legais** recebem só o que vem dos componentes compartilhados (header, rodapé, selos, tipografia).
- **D8 — Imagem Open Graph alinhada** (pedido do usuário em 2026-11-21): fundo neutro, título da home, marca do radar plana, ponto vermelho "ao vivo", sem gradientes nem violeta. **Sem números**: a imagem é gerada no build e dados ao vivo ficariam congelados.

## 4. Critérios de aceite

1. **CA1** Sem `bg-clip-text`, `radial-gradient`, `film-grain`, sombras coloridas nem `accent-violet` nos componentes da home.
2. **CA2** Nenhum `uppercase` com `tracking-[…]` na home; nenhum `font-bold`.
3. **CA3** Exatamente um botão com fundo `accent-pink` na home carregada.
4. **CA4** Painel do radar mostra total, idiomas e maior público a partir dos itens da grade; com filtro aplicado, o painel continua mostrando o total encontrado (não o filtrado).
5. **CA5** `languageBreakdown` e `topAudience` têm testes; ausência de espectadores nunca vira 0.
6. **CA6** Layout ok em 375 px e desktop, sem rolagem horizontal; teclado e foco preservados.
7. **CA7** lint, typecheck, testes e build passam.

---
Crédito: direção e passes seguem *unslop* por Damir Sokolovsky (@heydamir), CC BY 4.0.
