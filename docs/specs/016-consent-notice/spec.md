# 016 — Aceite da política e textos legais revisados (S-01 + S-11)

## Contexto

A S-01 do `sprint.md` pedia revisão dos textos de `/privacy` e `/terms`. Em 2026-11-22 o usuário entregou o documento
"Radar de Lives: respostas ao dossiê S-01 e minutas para revisão", com respostas às 7 perguntas e minutas dos dois
textos. O documento se declara "minuta técnica, não parecer jurídico"; **o usuário decidiu publicar e considerar a S-01
concluída** (decisão registrada em 2026-11-22).

A resposta 2 exige concordância afirmativa com a política antes de liberar as funcionalidades do cliente da API do
YouTube (gatilho da S-11). Por decisão do usuário, a S-11 foi feita na mesma entrega, para texto e código baterem.

## Decisões

| ID | Decisão | Origem |
| --- | --- | --- |
| D1 | Controlador: **Dario Reis**, pessoa física; contato `dev.darioreis@gmail.com` | Resposta 6 + usuário |
| D2 | Tela de aceite antes da lista de lives: "Li e concordo. Continuar" e "Não concordo" | Resposta 2 |
| D3 | Até o aceite, nada de `/api/lives` nem miniaturas de `i.ytimg.com` | Resposta 3 |
| D4 | Guardar no `localStorage` só `{version, acceptedAt}`; nada vai ao servidor; recusa não é gravada | Resposta 2 |
| D5 | Versão do aceite = `siteConfig.legal.updatedAt`; mudar a data pede novo aceite | Resposta 2 |
| D6 | Vercel Web Analytics continua carregando sem depender do aceite (só page views, sem query, sem `userId`) | Resposta 4 |
| D7 | Páginas legais, rodapé e cabeçalho ficam acessíveis sem aceite | Políticas do YouTube |
| D8 | Regiões: funções da Vercel e banco Upstash em `iad1` (Washington, D.C., EUA) | Verificado (abaixo) |
| D9 | Mantidos da S-02: e-mail clicável, Google como controlador nas miniaturas/player, obrigação legal, sem DPO separado | Spec 008 |

## Fatos verificados

- `vercel inspect radardelives.darioreis.dev`: funções em `[iad1]`.
- API da Vercel `/v1/storage/stores`: recurso `upstash-kv-copper-diamond` com `primaryRegion: iad1`.
- `lib/rate-limit/rate-limiter.ts` + `lib/lives/server.ts`: HMAC-SHA256 truncado, 30 req/min, TTL 60 s.
- `lib/config/server-env.ts`: cache 900 s + dado antigo 600 s.
- `components/analytics/site-analytics.tsx`: `<Analytics beforeSend={stripQuery} />`, sem eventos nem `userId`.

## Critérios de aceite

1. Na primeira visita o aviso aparece; depois do aceite não aparece de novo; com versão antiga guardada, aparece.
2. Antes do aceite (e depois de "Não concordo"), nenhuma requisição a `/api/lives` nem a `i.ytimg.com`.
3. A política descreve exatamente o que é guardado no navegador.
4. `/privacy` e `/terms` trazem os textos das minutas, ajustados ao código, sem campos entre colchetes.
5. `/privacy` e `/terms` continuam estáticas; lint, typecheck, testes e build verdes; teste novo da lógica de aceite.
6. Sem rolagem horizontal em 375 px.

## Pendências conhecidas (fora do código)

- **Mecanismo de transferência internacional:** o DPA da Upstash cita as cláusulas-padrão da Comissão Europeia, não as
  cláusulas-padrão da ANPD (Resolução CD/ANPD 19/2024); não foi achado documento da Vercel sobre isso. A política diz
  apenas que as transferências "ocorrem sob os contratos e as garantias de proteção de dados oferecidos por cada
  fornecedor" e **não** afirma conformidade com o art. 33. Confirmar com os fornecedores.
- **Registro de legítimo interesse** do limite de requisições: o documento traz um ponto de partida; o controlador
  precisa completar, datar e guardar (fora do repositório).
- O documento entregue não é parecer jurídico; a publicação foi decisão do usuário.
