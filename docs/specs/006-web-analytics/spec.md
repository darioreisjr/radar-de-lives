# 006 — Vercel Web Analytics

Status: implementada (ver `tasks.md`) · Data: 2026-11-21
Fonte: pedido do usuário em 2026-11-21 ("habilite o analytics da Vercel"). PRD §9 etapa 4 cita "telemetria mínima"; contagem de visitas não estava no PRD, por isso esta fatia.

## 1. Objetivo

Contar visitas e páginas vistas em produção com o Vercel Web Analytics, sem cookies próprios, e manter a política de privacidade fiel ao que o site faz.

## 2. Fatos confirmados (docs oficiais, 2026-11-21)

| Fonte | Fato |
| --- | --- |
| npm | `@vercel/analytics` 2.0.1 (publicado em 2026-03-12); peers `next >= 13`, `react ^18 \|\| ^19`. |
| Quickstart | Habilitar em **Analytics → Enable** no painel; `import { Analytics } from "@vercel/analytics/next"`; `<Analytics />` no layout raiz, após `{children}`. Rotas `/_vercel/insights/*` e `/<caminho-único>/*` passam a existir após o deploy. |
| Privacy and Compliance | Coleta: horário, URL, caminho dinâmico, referrer, parâmetros de consulta filtrados, país/região/cidade, sistema, navegador, tipo de dispositivo, versão do script. "Sem cookies de terceiros"; registro anônimo, não associado a IP; visitante identificado por hash da requisição; sessão descartada após 24 h. |
| Package | `beforeSend` permite descartar (`null`) ou alterar eventos. `mode` padrão `auto`; `debug` ligado automaticamente em `development`/`test`. |
| Limits and pricing | Hobby: 50 mil eventos/mês, janela de 1 mês. Ao exceder: **sem cobrança**; período de carência e depois a coleta para. |

## 3. Decisões

- **D1 — Só page views** (sem eventos customizados: não incluídos no Hobby).
- **D2 — `beforeSend` remove a query string** da URL antes do envio. O site não usa query na navegação hoje; isso garante que nada futuro (ex.: termos de busca) vá para o analytics.
- **D3 — Política de privacidade atualizada**: o item "não usa ferramentas de análise" deixa de ser verdade. Nova seção descreve o Vercel Web Analytics, os dados coletados e o link para a documentação de privacidade da Vercel.
- **D4 — Sem banner de consentimento nesta fatia**: o serviço declara não usar cookies de terceiros nem associar dados a IP. Fica como ponto para a revisão jurídica.

## 4. Critérios de aceite

1. **CA1** `<Analytics />` no layout raiz, importado de `@vercel/analytics/next`, com `beforeSend` que remove a query string (teste da função).
2. **CA2** `/privacy` descreve o Vercel Web Analytics e não afirma mais "não usa ferramentas de análise".
3. **CA3** lint, typecheck, testes e build passam; lockfile com as bindings do rolldown intactas.
4. **CA4** Após o deploy, a home de produção carrega o script do analytics (requisição para o caminho de intake da Vercel).
5. **CA5** Commits em Conventional Commits pt-BR, autor `darioreisjr`, sem segredos.

## 5. Pendência do usuário

- Confirmar no painel que **Analytics → Enable** foi clicado (a tela "Get Started" aparece após habilitar).
