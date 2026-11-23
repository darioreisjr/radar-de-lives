# 015 — QA de estados e movimento reduzido

Tarefa S-10 do [sprint.md](../../../sprint.md). Branch `sprint/015-manual-qa`.

## Contexto

Alguns estados nunca tinham sido vistos na interface real: quota esgotada, erro, dados antigos, lista vazia, live encerrada e outros resultados da revalidação no player, e `prefers-reduced-motion`. Esta tarefa verifica e registra, **sem gastar quota** e **sem alterar código**.

## Escopo

Incluído: verificação visual dos 9 casos em desktop (1280×800) e 375×812; esta spec.
Excluído: correções. Bugs encontrados viram tarefa nova (regra da S-10).

## Método

- **Navegador:** Chromium real (Playwright 1.65, `chromium-headless-shell` v1254), contra `next build && next start` local com `YOUTUBE_API_KEY=""`.
- **Simulação sem quota:** as respostas de `/api/lives` e `/api/lives/<id>` foram simuladas no navegador (interceptação de rede, equivalente à troca de `window.fetch` sugerida no sprint), com o mesmo suporte de `e2e/support.ts` da spec 014. Miniaturas e player responderam localmente; nenhuma chamada ao Google.
- **Capturas:** tela inteira (grade) ou viewport (diálogo), inspecionadas uma a uma. Não foram commitadas; ficam descritas abaixo.
- **Movimento reduzido:** em vez de mudar a configuração do Windows, a preferência foi emulada no motor do navegador (`emulateMedia({ reducedMotion: "reduce" })`), que é o mesmo sinal que o Windows envia ao Chrome. Conferido com `matchMedia("(prefers-reduced-motion: reduce)").matches === true` e pelos estilos computados.
- Desvio do texto do sprint (Claude in Chrome + configuração do Windows): o método acima dá o mesmo resultado, é reproduzível e não exige mudar o sistema do usuário. Os mesmos casos viraram teste automatizado na spec 014.

## Critério de aceite

1. **CA1** Tabela com estado, simulação, esperado, observado e OK/bug para os 9 casos, em desktop e 375 px (ver `tasks.md`).
