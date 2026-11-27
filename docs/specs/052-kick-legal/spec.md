# 052 — Kick na política de privacidade e nos termos

Issue [#54](https://github.com/darioreisjr/radar-de-lives/issues/54) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 3 (Kick) · Branch `sprint/052-kick-legal` · Modelo: spec 033 (Twitch) · Termos da Kick: spec 020 (P4)

## Contexto

O `CLAUDE.md` exige que `/privacy` e `/terms` reflitam o que o código faz. Com a Kick (specs 046 a 051): o servidor consulta a API da Kick com credenciais do site; depois do aceite, o navegador carrega miniaturas de `images.kick.com` e `web.kick.com`; e, se a pessoa quiser, o player de `player.kick.com`, que pode usar cookies da Kick. Os Developer Terms da Kick (spec 020, P4) pedem:
- política de privacidade pública;
- caminho claro até a fonte e atribuição sem uso indevido da marca;
- **embeds fora de sites voltados a menores de 16 anos**;
- **proibição de re-distribuir** os dados da API.

## Objetivo

`/privacy` e `/terms` descrevem com precisão o uso da API, das miniaturas e do player da Kick, e a data de atualização muda para pedir novo aceite.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | **Idade mínima do site inteiro passa a 16 anos** (era 13, pela Twitch). | Decisão do responsável (opção 1, 2026-11-27): exigência da Kick para o player; mais simples e coerente que uma regra só para a Kick. |
| D2 | Links oficiais da Kick para usuários: `https://kick.com/privacy-policy` e `https://kick.com/terms-of-service` (ambos `200` em 2026-11-27). | Política e termos citados pela Kick. |
| D3 | Tempos de cache da Kick no texto vêm dos padrões do código (180 s + 600 s), amarrados por teste. | Mesma regra da spec 033 D2. |
| D4 | Termos: na Kick, o selo "Conteúdo adulto" não é exibido porque a Kick marca quase toda a categoria de GTA 6 (decisão D-K1); o texto diz isso e trata todas as lives como conteúdo para adultos. | Honestidade sobre o selo. |
| D5 | Termos, "Uso permitido": proíbe copiar ou redistribuir em massa os dados exibidos, inclusive pela API interna do site. | Developer Terms da Kick (Schedule 1, C: re-distribuição proibida). |
| D6 | Aviso de marca (`siteConfig.disclaimer`) inclui a Kick; nomes sem logotipo. | Termos da Kick (3.1, 6) e identidade visual. |
| D7 | `siteConfig.legal.updatedAt` = `2026-11-27`, o que **pede novo aceite a todos**. **O PR só é mesclado junto com a ativação da Kick (#55).** Se o dia mudar, atualizar a data. | Mesmo cuidado da spec 033 D3. |
| D8 | `components/consent/policy-gate.tsx` não muda: o gate já bloqueia a lista inteira antes do aceite. Um e2e prova que nada sai para a Kick antes do aceite. | CA3. |

## Critérios de aceite

1. **CA1:** a política cita a Kick, o que é carregado dela e quando, com link para a política dela.
2. **CA2:** os termos têm o aviso de marca da Kick, a ausência de afiliação e a idade mínima de 16 anos.
3. **CA3:** antes do aceite, nenhuma requisição sai para domínios da Kick (e2e).
4. **CA4:** `updatedAt` foi atualizado, e os tempos de cache do texto batem com o código (teste).

## Arquivos fora da lista da issue (testes)

- `tests/legal-twitch.test.ts`: as frases de 13 anos, o aviso de marca e a data mudam.
- `tests/legal-kick.test.ts` (novo) e `e2e/platforms.spec.ts` (CA3).

## Adendo para os registros de LGPD (o controlador atualiza fora do repositório)

**Legítimo interesse:** sem mudança.

**Transferência internacional** (art. 33 da LGPD), novo item sugerido:

> **Kick (Kick Streaming).** Quando o visitante, depois de aceitar a política, vê a lista (miniaturas de `images.kick.com` e `web.kick.com`) ou escolhe "Carregar player" numa live da Kick, o navegador dele se conecta diretamente à Kick, que recebe o IP, dados técnicos da requisição e, no player, pode usar cookies próprios. A Kick age como controladora desses dados, conforme a sua Política de Privacidade (https://kick.com/privacy-policy). O Radar de Lives não envia dados de visitantes à Kick: as consultas do servidor à API usam só credenciais do site e retornam metadados públicos das lives. Situação igual às do Google/YouTube e da Twitch já registradas. Data: [data da ativação].

## Riscos

- **Mesclar antes da ativação:** o aviso de aceite reapareceria e os textos citariam uma Kick desligada. Mitigação: PR em rascunho, com aviso no título.
- **Rollback:** reverter o PR.
