# 022 — Contrato `LivesProvider` e agregador com isolamento de falhas

Issue [#34](https://github.com/darioreisjr/radar-de-lives/issues/34) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 1 (Fundação) · Branch `sprint/022-providers-aggregator`

## Contexto

`app/api/lives/route.ts` chama direto o serviço do YouTube (`getLivesService()`). Para somar plataformas sem que uma derrube a outra, a rota precisa de um ponto único que consulte cada provedor e junte os resultados (PRD §12.3, RF6).

## Objetivo

Criar um agregador que consulta N provedores em paralelo, isola falhas e devolve uma lista única. Nesta fatia **o único provedor é o YouTube**, então nada muda para o usuário.

## Escopo

**Inclui**
- Interface `LivesProvider` (`lib/lives/providers/types.ts`).
- Adaptador `createYoutubeProvider` sobre o `LivesService` atual, sem mudar quota, cache, single-flight, trava nem orçamento.
- Agregador (`lib/lives/aggregator.ts`):
  - `Promise.allSettled`;
  - timeout opcional por provedor;
  - intercalação (D5);
  - deduplicação por `id`;
  - regras de erro total e parcial.
- `LivesPayload.sources` (opcional no tipo) com o estado de cada plataforma.
- A rota `/api/lives` passa a usar o agregador.
- Telemetria: evento `provider_failed`, com `platform` e `code`.

**Não inclui**
- Aviso visual de resultado parcial (#38).
- Flags de provedor (#35).
- Twitch e Kick.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | O cache do YouTube **mantém** o namespace `lives` e a chave `page:first` (e `page:<token>`). | Trocar a chave invalidaria o cache no deploy, gastando 1 `search.list` extra, e repetiria o incidente do #64 (itens antigos e novos misturados). |
| D2 | **Sem timeout extra para o YouTube.** O timeout do agregador é opcional por provedor (`timeoutMs`). | O cliente do YouTube já tem timeout de 8 s com 1 nova tentativa; um corte a mais mudaria o comportamento atual. |
| D3 | Intercalação (PRD D5): uma rodada por posição, na ordem dos provedores (YouTube primeiro), e depois `rank` = posição final. **Só quando mais de um provedor trouxer itens.** Com um provedor só, os itens saem idênticos, inclusive o `rank` original. | Zero mudança com um provedor. |
| D4 | Com `pageToken`, só o YouTube é consultado. O `nextPageToken` da resposta é o do YouTube. | `pageToken` só existe no YouTube (plano, seção 3). |
| D5 | **Erro total:** se todos os provedores falharem, o agregador relança o erro do YouTube (ou o primeiro, se o YouTube não estiver na lista). A rota responde como hoje. | Mesmo código e mesmo status HTTP de hoje. |
| D6 | **Erro parcial:** se algum provedor responder, a resposta é `200`, com `sources[i].ok = false` e `errorCode` nos que falharam. | PRD RF6. |
| D7 | Metadados agregados: `updatedAt` = o **mais antigo** entre as fontes que responderam; `cached` = todas vieram do cache; `stale` = alguma está vencida. Com um provedor, são iguais aos dele. | Não esconder dado velho. |
| D8 | `withIdentity` sai da rota e vai para o adaptador do YouTube. Todo item que sai de um provedor está completo. A defesa no estado do cliente continua. | Lição do #64. |
| D9 | `sources` é **opcional** no tipo `LivesPayload`. O servidor sempre envia; o cliente trata a ausência como "só YouTube". | Compatível com mocks do e2e e com clientes antigos em cache do navegador. |

## Lição do incidente do #64

O teste de caracterização da 021 só rodava com o **cache vazio**. Esta spec exige testes com **cache já preenchido no formato antigo** (CA7) e com **cache válido**, além do cache vazio.

## Critérios de aceite

1. **CA1:** com só o YouTube, a saída do agregador tem os mesmos itens, na mesma ordem e com os mesmos valores do serviço do YouTube (comparação direta e snapshot de caracterização inalterado).
2. **CA2:** com dois provedores falsos, um falhando, o resultado traz os itens do outro e `sources` marca o que falhou com `ok: false` e `errorCode`.
3. **CA3:** com todos falhando, o erro relançado é o do YouTube (mesmo `code`), e a rota responde com o mesmo status HTTP de hoje.
4. **CA4:** um provedor com `timeoutMs` que demora mais que isso é marcado como falho (`upstream_unavailable`) sem segurar a resposta.
5. **CA5:** o número de chamadas ao YouTube por requisição não muda (teste conta as chamadas do `fetch`), nem com cache vazio nem com cache válido.
6. **CA6:** `provider_failed` registra só `platform` e `code`, nunca mensagem, URL ou segredo.
7. **CA7:** com o cache preenchido com itens no formato anterior à 021, o agregador devolve itens completos (`id`, `platform`, `sourceId`, `isMature`) e sem colapsar a lista.
8. **CA8:** intercalação com dois provedores: `[yt0, tw0, yt1, tw1, yt2]`, com `rank` 0 a 4; e `pageToken` consulta só o YouTube.

## Riscos

- **Regressão na rota.** Mitigação: CA1, CA3 e CA5, e2e completo.
- **Rollback:** reverter o PR. O cache não muda de chave (D1), então reverter não exige limpeza.
