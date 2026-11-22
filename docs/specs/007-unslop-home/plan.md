# 007 — Plano

Passes da skill unslop, em ordem, dentro do PRD (D1):

1. **Espaçamento:** paddings dos cards 20, selos `p-3`, rótulos dos filtros `mb-2`; sem `text-[11px]`.
2. **Cor:** remove gradiente de texto, manchas radiais, grão de filme, sol em gradiente, sombra rosa e violeta; avisos e selos neutros; rosa só em "Ver lives encontradas" (D2); marca do radar plana.
3. **Ícones:** um ícone externo com traço 1,5; sem emoji na interface (emoji dos títulos do YouTube é conteúdo dos criadores e fica).
4. **Cópia:** título do hero "Lives de GTA 6 no ar agora"; sem rótulo em maiúsculas; um único aviso de cobertura (acima da grade); ação secundária "Como funciona".
5. **Tipo:** Oswald 500 só no título do hero e das páginas legais; resto em Geist 400/500; sentence case; números `tabular-nums`.
6. **Layout:** hero em divisão assimétrica (texto + painel de 400 px), sem faixa vazia.
7. **Detalhes:** selos com raio 6 em vez de pílula; ações dos cards lado a lado e neutras.
8. **Visual:** painel do radar com dados reais (`lib/lives/radar-stats.ts`) no lugar da arte decorativa.
9. **Movimento:** hover só com degrau de borda e 2 px; escalonamento de entrada limitado a 6 cards.

Arquitetura: `LivesProvider` (cliente) envolve hero e grade; `LiveExplorer` e `RadarPanel` usam `useLives()`.
