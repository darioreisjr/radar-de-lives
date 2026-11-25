# 021 — Modelo de live independente de plataforma

Issue [#33](https://github.com/darioreisjr/radar-de-lives/issues/33) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 1 (Fundação) · Branch `sprint/021-platform-model`

## Contexto

O tipo `LiveItem` fica em `lib/youtube/types.ts` e usa `videoId` como identificador. O código inteiro assume YouTube:
- chave React e seleção na lista (`live-explorer.tsx`);
- id do título no DOM (`live-card.tsx`);
- deduplicação (`dedupeByVideoId`);
- revalidação (`explorer-state.ts`);
- fábricas de dados do e2e (`e2e/support.ts`).

Um id da Twitch pode colidir com um id do YouTube.

## Objetivo

Criar um modelo de live neutro, com `platform`, **sem nenhuma mudança visível** e sem mudar valor nenhum do payload atual (PRD §12.4; plano, seção 5.2).

## Escopo

**Inclui**
- `lib/lives/types.ts` com:
  - `Platform` e `LiveItem` neutro;
  - `LiveLanguage`, `LangFilter`, `SortOption`;
  - `LivesPayload`, `LivesErrorCode` e `LivesErrorPayload`.
- `lib/youtube/types.ts` reexporta esses tipos durante a transição e mantém os tipos crus `Yt*` e `VideoStatusPayload`.
- Campos novos no `LiveItem`: `id`, `platform`, `sourceId` e `isMature`.
- `dedupeById` genérico em `lib/lives/identity.ts`, com helpers de identidade.
- Componentes e estado usam `id` como chave e como seleção.
- A revalidação casa o status com `platform === "youtube"` e `sourceId`.
- Fixtures (`lib/fixtures/lives.ts`) e fábricas do e2e (`e2e/support.ts`) atualizadas.

**Não inclui**
- Twitch e Kick.
- Agregador (#34).
- Rota de status por plataforma (#36): `VideoStatusPayload` e `/api/lives/[videoId]` não mudam.
- Mudanças visuais.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | `videoId` **continua** no `LiveItem` como campo obsoleto (`@deprecated`), igual a `sourceId`. A remoção fica para a consolidação (#57). | O plano proíbe mudar ou remover campos do payload na Fase 1, e o cliente atual o usa. |
| D2 | `id` = `` `${platform}:${sourceId}` ``. | Chave única entre plataformas. |
| D3 | O id do título no DOM **não muda para o YouTube**: `live-<videoId>-title`. Outras plataformas usam `live-<platform>-<sourceId>-title`, sem caracteres inválidos. | Zero mudança visível ou de acessibilidade. |
| D4 | `isMature` é `false` no YouTube. | PRD D6: a busca do YouTube não informa conteúdo adulto. |
| D5 | `dedupeByVideoId` continua em `lib/youtube/normalize.ts` para a normalização do YouTube. O estado do cliente passa a usar `dedupeById`. | Mudança mínima no serviço do YouTube. |

## Requisitos

- **RF1:** todo `LiveItem` do YouTube tem `platform: "youtube"`, `sourceId` e `videoId` iguais ao id do vídeo, `id` igual a `youtube:<id do vídeo>` e `isMature: false`.
- **RF2:** a deduplicação no cliente é por `id`. Itens com o mesmo `sourceId` em plataformas diferentes **não** são deduplicados.
- **RF3:** chave React, seleção e abertura do player usam `id`.
- **RNF1:** o teste de caracterização (`tests/characterization.test.ts`) passa **sem atualizar o snapshot**.
- **RNF2:** as suítes unitária e e2e passam sem mudar asserções; só são aceitas mudanças de nome de campo e de fábrica de dados.

## Critérios de aceite

1. **CA1:** RF1, com teste unitário sobre `normalizeLives` e sobre os dados de demonstração.
2. **CA2:** nenhum componente usa `videoId` como chave React ou como seleção (revisão e `grep`).
3. **CA3:** o id do DOM é válido e, no YouTube, igual ao de antes (teste unitário).
4. **CA4:** as suítes unitária e e2e passam, e o snapshot de caracterização não muda.
5. **CA5:** dois itens com o mesmo `sourceId` e plataformas diferentes não são deduplicados (teste).

## Riscos

- **Regressão no YouTube.** Mitigação: o teste de caracterização foi escrito antes da mudança, e o e2e cobre os dois perfis.
- **Rollback:** reverter o PR. Nada depende de configuração externa.
