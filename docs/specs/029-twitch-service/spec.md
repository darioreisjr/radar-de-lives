# 029 — Serviço da Twitch com cache e registro no agregador

Issue [#41](https://github.com/darioreisjr/radar-de-lives/issues/41) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 2 (Twitch) · Branch `sprint/029-twitch-service`

## Contexto

O cliente (spec 027) e a busca (spec 028) existem, mas nada chama a Twitch. O YouTube tem cache, cache vencido, trava entre instâncias e single-flight (`lib/youtube/service.ts`). A Twitch precisa das mesmas proteções antes de entrar no agregador (spec 022), atrás de `LIVES_PROVIDERS` (spec 023).

## Objetivo

Um `twitchProvider` registrado no agregador e **ativo só quando `twitch` estiver em `LIVES_PROVIDERS` e houver credenciais**. Sem isso, nenhuma chamada à Twitch.

## Escopo

**Inclui**
- **`lib/twitch/service.ts`:**
  - cache `lives:twitch`;
  - TTL próprio;
  - cache vencido servido em falha;
  - trava entre instâncias e single-flight;
  - telemetria.
- **`lib/lives/providers/twitch.ts`:** implementa `LivesProvider`, com `timeoutMs` no agregador.
- **Variáveis:** `TWITCH_CACHE_TTL_SECONDS` (padrão 180) e `TWITCH_STALE_TTL_SECONDS` (padrão 600).
- **`server.ts`:** candidato `twitch` na seleção (`selectProviders`).

**Não inclui**
- Revalidação de status (#42).
- Player (#44).
- Ativação em Preview e Production (#47).

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | TTL padrão de **180 s** (limites 30 a 3.600) e cache vencido de **600 s** (limites 0 a 3.600). O cache fica no máximo 2 h, bem abaixo das **24 h** do Developer Agreement. | Spec 019 (Schedule 1 §C). A Twitch não tem quota diária apertada, então o TTL é mais curto que o do YouTube (900 s). |
| D2 | A trava entre instâncias usa o mesmo intervalo mínimo do YouTube (`LIVE_RATE_LIMIT_SECONDS`, 30 s). **Sem orçamento diário.** | O limite da Twitch é de 800 pontos por minuto e cada atualização custa cerca de 2 (spec 028). |
| D3 | Falha do store → `upstream_unavailable` sem chamar a Twitch, como no YouTube (spec 005 D6). | Comportamento consistente. |
| D4 | **Falha na Twitch:** com cache vencido disponível → serve o cache com `stale: true` e log `stale_served {platform: "twitch"}`; sem cache → o erro sobe e o agregador marca `ok: false` (spec 022 D6). | Resultado parcial em vez de erro. |
| D5 | `timeoutMs` do provedor no agregador = **12 s**. A busca continua em segundo plano e grava o cache. | A Twitch não pode segurar a resposta do YouTube (spec 022 CA4). |
| D6 | O candidato `twitch` entra **sempre** na seleção, com `isConfigured()` = credenciais presentes. `selectProviders` o ignora sem credenciais ou sem `twitch` em `LIVES_PROVIDERS` (spec 023 R4). | Uma única regra de ativação. |
| D7 | As credenciais e as variáveis da Twitch entram na assinatura do runtime. | Em desenvolvimento, mudar a variável recria o runtime. |

## Critérios de aceite

1. **CA1:** sem `twitch` em `LIVES_PROVIDERS`, nenhuma chamada à Twitch acontece.
2. **CA2:** com `twitch` ativo, o agregador traz itens do YouTube e da Twitch, intercalados.
3. **CA3:** duas requisições simultâneas com o cache vazio geram **uma** busca na Twitch.
4. **CA4:** com a Twitch fora do ar e cache vencido disponível, a resposta usa o cache, e o `source` da Twitch tem `stale: true`.
5. **CA5:** com a Twitch fora do ar e sem cache, o YouTube continua aparecendo, e `sources` marca a Twitch com `ok: false`.
6. **CA6:** o consumo do YouTube não muda (contagem de chamadas igual com e sem Twitch).
7. **CA7:** TTL e cache vencido respeitam os limites (D1).

## Riscos

- **Rollback:** tirar `twitch` de `LIVES_PROVIDERS` e fazer redeploy, sem reverter código. Em produção, nada muda até a #47.
