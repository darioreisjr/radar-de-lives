# 034 — Textos do site, metadata e imagem OG conforme as plataformas ativas

Issue [#46](https://github.com/darioreisjr/radar-de-lives/issues/46) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 2 (Twitch) · Branch `sprint/034-multiplatform-copy`

## Contexto

Vários textos falam em lives "no YouTube". Com a Twitch ativa, eles ficariam errados.

## Objetivo

Os textos genéricos citam as plataformas **ativas**, calculadas pela mesma regra do agregador. Com só o YouTube, **todo texto fica idêntico ao de hoje**. A Kick (Fase 3) não vai precisar de outra issue de textos.

## Levantamento das ocorrências de "YouTube"

| Onde | Tipo | Tratamento |
|---|---|---|
| Metadata (`description` e Open Graph) | Genérica | `siteDescription(platforms)` |
| Imagem OG (texto alternativo e frase) | Genérica | `formatPlatformList` / `heroLead` |
| Hero ("encontradas no…", "assista aqui ou no…") | Genérica | `heroLead` / `watchElsewhere` |
| Nota de cobertura (grade e rodapé) | Genérica | `coverageNote(platforms)` |
| Rodapé ("assistidos no YouTube") | Genérica | `watchElsewhere` |
| Radar ("quando a consulta ao YouTube responder") | Genérica | `searchSubject` |
| Aviso de aceite ("miniaturas direto do YouTube") | Genérica | `thumbnailsSource` |
| "usa os YouTube API Services" (aviso de aceite e rodapé) | **Exigência do YouTube** | Continua; com a Twitch ativa, acrescenta "e a API da Twitch" e os Termos da Twitch no rodapé |
| Quota esgotada, "Busca no YouTube não configurada" | **Específica do YouTube** | Sem mudança |
| Aviso de marca (`disclaimer`) | Legal | Já tratado na spec 033 (#45); não alterado aqui |
| `/privacy` e `/terms` | Legal | Spec 033 |

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | **Lista no servidor:** `getActivePlatforms()` em `lib/lives/active-platforms.ts` (`server-only`), com `parseProviderList` + `selectProviders` + credenciais da Twitch: a mesma regra do agregador (spec 023). | Os textos batem com o que o site realmente busca, inclusive no estado de erro, antes de `sources` chegar. |
| D2 | **Textos em funções puras** (`lib/lives/copy.ts`), com as formas flexionadas do mapa de plataformas e o novo `apiLabel`. | Testáveis; gênero certo ("no YouTube e na Twitch"). |
| D3 | Os componentes do servidor (hero, rodapé, layout, imagem OG) leem a lista direto. Os do cliente (aviso de aceite, radar, grade) a recebem da página por propriedade e pelo `LivesProvider`. | Sem `NEXT_PUBLIC_` (spec 023 D1). |
| D4 | **A lista é lida no build** (metadata, imagem OG e página pré-renderizada). Mudar `LIVES_PROVIDERS` ou as credenciais na Vercel exige redeploy, igual ao agregador. | Coerente com a spec 023 (D3). |
| D5 | Com várias plataformas: "assista aqui ou **na plataforma de origem**" e radar "quando **a busca** responder". | Uma lista longa deixaria a frase pesada. |

## Critérios de aceite

1. **CA1:** com só o YouTube, todos os textos ficam iguais aos de hoje (teste com as frases exatas e build real).
2. **CA2:** com YouTube e Twitch ativos, os textos genéricos citam as duas (teste e build real).
3. **CA3:** "Lives encontradas" continua, e nenhum texto promete "todas".
4. **CA4:** metadata coberta com uma e com duas plataformas (`siteDescription` e build real).

## Riscos

- **Rollback:** reverter o PR.
- **Merge:** com só o YouTube em produção, nada muda; pode ir antes da ativação.
