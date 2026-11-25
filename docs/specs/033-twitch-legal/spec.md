# 033 — Twitch na política de privacidade e nos termos

Issue [#45](https://github.com/darioreisjr/radar-de-lives/issues/45) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 2 (Twitch) · Branch `sprint/033-twitch-legal`

## Contexto

O `CLAUDE.md` exige: "Textos de /privacy e /terms devem refletir o que o código faz; atualize-os ao mudar coleta de dados ou integrações". Com a Twitch, o servidor consulta a API dela, e o navegador carrega miniaturas (depois do aceite) e, se a pessoa quiser, o player da Twitch, que pode gravar cookies dela. O Developer Agreement da Twitch (spec 019) exige:
- política de privacidade pública;
- honestidade sobre a relação com a Twitch;
- site não direcionado a menores de 13 anos;
- caminho até a fonte.

## Objetivo

`/privacy` e `/terms` descrevem com precisão o uso da API, das miniaturas e do player da Twitch, e a data de atualização muda para pedir novo aceite.

## Escopo

**Inclui**
- **`/privacy`:**
  - resumo;
  - nova seção "Uso da API da Twitch";
  - cache (3 min + 10 min);
  - registros técnicos;
  - miniaturas (`static-cdn.jtvnw.net`) e player da Twitch;
  - fornecedor Twitch;
  - transferência internacional;
  - retenção;
  - controles;
  - crianças (menores de 13 anos).
- **`/terms`:**
  - o serviço;
  - YouTube, Twitch e terceiros;
  - marcas (sem afiliação; nomes só para indicar a origem, sem logotipos);
  - conteúdo com link para a origem;
  - uso permitido;
  - nova seção "Idade e conteúdo";
  - atualidade (cache) e limites das duas APIs.
- **`siteConfig.disclaimer`:** inclui a Twitch (aparece no rodapé e nos termos).
- **`siteConfig.legal.updatedAt`** = `2026-11-25`, o que **pede novo aceite a todos**.
- **Testes:**
  - consistência dos textos com o código;
  - e2e: nenhuma requisição à Twitch antes do aceite.

**Não inclui**
- Os registros de LGPD (legítimo interesse e transferência internacional), que ficam **fora do repositório** com o controlador (spec 016). O texto do adendo está na seção abaixo.
- Revisão por advogado (decisão do responsável, como na S-01).

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | Links oficiais da Twitch, com as URLs finais conferidas em 2026-11-25: `https://legal.twitch.com/legal/privacy-notice/` e `https://legal.twitch.com/legal/terms-of-service/`. | Citados no Developer Agreement; sem redirecionamento. |
| D2 | Os tempos de cache no texto vêm dos padrões do código (YouTube: 900 s + 600 s; Twitch: 180 s + 600 s), e um teste os amarra. | O texto não pode divergir do código. |
| D3 | **Este PR só pode ser mesclado junto com a ativação da Twitch (#47).** Se o dia mudar, atualizar `updatedAt` para a data real. | Mudar `updatedAt` reexibe o aviso de aceite a todos os visitantes (spec 016), e os textos citam a Twitch. |
| D4 | O aviso de marca usa só os nomes, sem logotipos (regra de identidade visual), e declara a ausência de afiliação. | Developer Agreement (II.B.2.ii) e `CLAUDE.md`. |

## Adendo para os registros de LGPD (o controlador atualiza fora do repositório)

**Registro de legítimo interesse** (limite de requisições, Vercel Web Analytics): **sem mudança.** A Twitch não muda o rate limit nem o Analytics, e o servidor não envia dados de visitantes à Twitch.

**Registro de transferência internacional** (art. 33 da LGPD), novo item sugerido:

> **Twitch Interactive, Inc. (EUA).** Quando o visitante, depois de aceitar a política, vê a lista (miniaturas de `static-cdn.jtvnw.net`) ou escolhe "Carregar player" numa live da Twitch, o navegador dele se conecta diretamente à Twitch, que recebe o IP, dados técnicos da requisição e, no player, pode usar cookies próprios. A Twitch age como controladora desses dados, conforme o seu Aviso de Privacidade (https://legal.twitch.com/legal/privacy-notice/). O Radar de Lives não envia dados de visitantes à Twitch: as consultas do servidor à API usam só credenciais do site e retornam metadados públicos das lives. Situação igual à do Google/YouTube já registrada. Data: [data da ativação].

## Critérios de aceite

1. **CA1:** a política cita a Twitch, o que é carregado dela e quando, com link para o aviso de privacidade dela.
2. **CA2:** os termos têm o aviso de marca e a ausência de afiliação com a Twitch, e a idade mínima de 13 anos.
3. **CA3:** antes do aceite, nenhuma requisição sai para domínios da Twitch (e2e).
4. **CA4:** `updatedAt` foi atualizado, e os tempos de cache do texto batem com o código (teste).

## Riscos

- **Mesclar antes da ativação:** o aviso de aceite reapareceria e os textos citariam uma Twitch ainda desligada. Mitigação: PR em rascunho, com aviso no título.
- **Rollback:** reverter o PR. O aviso de aceite volta à versão anterior.
