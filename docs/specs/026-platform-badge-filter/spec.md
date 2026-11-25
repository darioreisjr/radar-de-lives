# 026 — Selo de plataforma, filtro por plataforma e aviso de resultado parcial

Issue [#38](https://github.com/darioreisjr/radar-de-lives/issues/38) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 1 (Fundação) · Branch `sprint/026-platform-badge-filter`

## Contexto

Com mais de uma plataforma, a pessoa precisa saber de onde vem cada live e poder filtrar (PRD §12.3 RF5 e RF6; D4 e D6). O servidor já envia `sources` com as plataformas ativas e o estado de cada uma (spec 022).

## Objetivo

Interface pronta para várias plataformas, que **só aparece quando há mais de uma ativa**. Com só o YouTube, a página fica igual à de hoje.

## Escopo

**Inclui**
- **Selo de plataforma** no card ("YouTube", "Twitch", "Kick"), só texto.
- **Selo "Conteúdo adulto"** quando `isMature` (PRD D6). Aparece mesmo com uma plataforma; no YouTube é sempre `false`.
- **Filtro "Plataforma"** ("Todas" e uma opção por plataforma ativa), combinável com busca, idioma e ordenação.
- **Aviso de resultado parcial:** "Algumas plataformas estão indisponíveis agora", com `role="status"`, quando alguma fonte falhou e outra respondeu.
- **Painel do radar:** contagem por plataforma.
- **Aviso de dados antigos:** com várias plataformas, o texto deixa de citar só o YouTube.

**Não inclui**
- Textos do hero, da metadata e da imagem OG (#46).
- Players da Twitch e da Kick (#44 e #53).

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | Plataformas ativas = `sources[].platform`. Sem `sources`, vale `["youtube"]`. Ativa ≠ respondendo: uma fonte com `ok: false` continua ativa. | Contrato da spec 022 (D9). |
| D2 | Selo, filtro e contagem por plataforma aparecem só com **2 ou mais** plataformas ativas. | Zero mudança com só o YouTube. |
| D3 | **Sem cores novas.** Os selos usam o componente `Badge` com tons que já existem (`neutral` para plataforma; `live` para conteúdo adulto) e só texto, sem logos nem cores de marca. | Identidade visual própria (`CLAUDE.md`); o contraste dos tons já é coberto por `tests/contrast.test.ts`. |
| D4 | O filtro roda **no cliente**, como o de idioma. Com uma plataforma ativa, o valor do filtro é ignorado. | A API não muda (plano, seção 3), e não sobra filtro "preso" numa plataforma desligada. |
| D5 | Os dados de demonstração **não mudam**. Os cenários com várias plataformas ficam no e2e, com dados simulados. | O snapshot de caracterização cobre os dados de demonstração. |

## Critérios de aceite

1. **CA1:** com uma plataforma ativa (ou sem `sources`), não aparecem selo de plataforma, filtro "Plataforma", aviso parcial nem contagem por plataforma (e2e). Os e2e existentes passam sem mudança.
2. **CA2:** com `sources` de várias plataformas, cada card mostra o selo da sua plataforma, e o filtro lista só as plataformas ativas.
3. **CA3:** o filtro de plataforma combina com busca, idioma e ordenação (unitário e e2e).
4. **CA4:** o aviso parcial aparece quando uma fonte falha e outra responde, com `role="status"`.
5. **CA5:** `tests/contrast.test.ts` continua passando (sem cores novas).
6. **CA6:** o filtro funciona por teclado, tem rótulo acessível e foco visível. Os selos são texto (lidos por leitor de tela). Movimento reduzido sem mudança.

## Riscos

- **Rollback:** reverter o PR. Com uma plataforma ativa, nada disso aparece.
