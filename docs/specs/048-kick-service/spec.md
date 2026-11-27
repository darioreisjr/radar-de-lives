# 048 — Serviço da Kick com cache e single-flight, registrado no agregador

Issue [#50](https://github.com/darioreisjr/radar-de-lives/issues/50) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 3 (Kick) · Branch `sprint/048-kick-service` · Specs: 020 (spike), 046 (cliente), 047 (busca)

## Contexto

O cliente (046) e a busca (047) da Kick existem, mas nada os usa. A Twitch já tem o mesmo caminho pronto (spec 029): serviço com cache compartilhado, cache vencido em falha, trava entre instâncias e single-flight; provedor registrado no agregador e ativo só com a plataforma em `LIVES_PROVIDERS` e as credenciais presentes.

## Objetivo

`kick` em `LIVES_PROVIDERS` (com credenciais) faz `GET /api/lives` trazer as lives da Kick junto com as das outras plataformas, sem mudar nada quando a Kick não está listada.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | `lib/kick/service.ts` com o **mesmo desenho do serviço da Twitch** (spec 029): cache em `lives:kick` (chave `page:first`), cache vencido em falha, trava entre instâncias, espera pelo cache de outra instância e single-flight. Sem orçamento diário. | A Kick não tem quota diária documentada (spec 020). O serviço da Twitch registra `platform: "twitch"` fixo e não está entre os arquivos desta issue: o da Kick é um arquivo próprio. Unificar os dois fica como melhoria futura. |
| D2 | `KICK_CACHE_TTL_SECONDS` (padrão **180**, de 30 a 3600) e `KICK_STALE_TTL_SECONDS` (padrão **600**, de 0 a 3600). | Mesmos valores da Twitch; dentro do intervalo sugerido na issue e bem abaixo das 24 h dos termos da Kick (spec 020, P4). |
| D3 | Falha do store fecha sem chamar a Kick (`store_error` com `platform: "kick"`). | Igual a YouTube e Twitch. |
| D4 | `429` vem do cliente como `rate_limited` (com `Retry-After`); o serviço serve o cache vencido se houver, senão a Kick aparece com `ok: false` em `sources`. A trava usa `LIVE_RATE_LIMIT_SECONDS`, como na Twitch. | A Kick não documenta limite numérico (spec 020, I4). |
| D5 | Provedor `lib/lives/providers/kick.ts`: `timeoutMs` de **12 s** no agregador; `isConfigured` = credenciais presentes; itens passam por `withIdentity`. **Sem revalidação de status** ainda (`status` indefinido → `/api/status/kick/<id>` responde `400` até a #51). | Mesmo padrão da Twitch; a #51 trata o status. |
| D6 | Telemetria: `kick_call` (só a quantidade de itens) em cada busca real; `stale_served` com `platform: "kick"`; erros de rede e de API já saem como `kick_error` pelo cliente. **Acerto de cache não é logado.** | A issue pedia log de acerto e falta de cache; um evento por requisição com cache inundaria os logs (que duram ~1 h). A falta de cache equivale a `kick_call`. |
| D7 | `lib/lives/active-platforms.ts` passa a considerar a Kick (credenciais), para os textos do site citarem a Kick quando ela estiver ativa (regra da spec 034). | Sem isso, com a Kick ativa, a metadata e o hero não a citariam. Arquivo fora da lista da issue: **ampliação a confirmar com o responsável**. |
| D8 | `.env.example` com `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`, `KICK_CATEGORY_ID` e os TTLs da Kick. | Pendência da #48. Arquivo fora da lista da issue: **ampliação a confirmar com o responsável**. |

## Critérios de aceite

1. **CA1:** sem `kick` em `LIVES_PROVIDERS` (ou sem credenciais), nenhuma chamada à Kick acontece.
2. **CA2:** com `kick` ativo, o agregador traz itens do YouTube e da Kick juntos, intercalados.
3. **CA3:** duas requisições simultâneas com o cache vazio geram uma busca na Kick.
4. **CA4:** com a Kick fora do ar e cache vencido disponível, a resposta usa o cache e marca `stale: true` na Kick em `sources`.
5. **CA5:** com a Kick fora do ar e sem cache, o YouTube continua aparecendo e `sources` marca a Kick com `ok: false`.
6. **CA6:** o consumo de quota do YouTube não muda (teste do agregador).

## Fora do escopo

Status (#51), CSP (#52), player (#53), textos legais (#54), ativação na Vercel (#55). Em produção, nada muda até a #55: a Kick não está em `LIVES_PROVIDERS`.

## Riscos e rollback

Rollback: tirar `kick` de `LIVES_PROVIDERS` e fazer o redeploy; ou reverter o PR.
