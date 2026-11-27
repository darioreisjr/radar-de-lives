# 051 — Player embutido da Kick, com link de fallback

Issue [#53](https://github.com/darioreisjr/radar-de-lives/issues/53) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 3 (Kick) · Branch `sprint/051-kick-player` · Specs: 020 (spike), 025 (player por plataforma), 032 (player da Twitch), 044 (aviso de login), 049 (status), 050 (CSP)

## Contexto

O diálogo do player escolhe a URL e os textos pelo mapa de plataformas (spec 025). A Kick está como "só link" (`embed: false`). O spike (P3) mostrou que `https://player.kick.com/<slug>?autoplay=false&muted=true` carrega e toca num iframe de outro domínio, **sem pedir login**, com o aviso "Visit KICK for HD quality". A CSP já libera `player.kick.com` (spec 050) e a revalidação da Kick existe (spec 049).

## Objetivo

"Assistir aqui" numa live da Kick abre o player oficial, sempre com "Abrir na Kick" como alternativa.

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | `embedSrc(slug)` = `https://player.kick.com/<slug>?autoplay=false&muted=true` (slug codificado). Sem `parent`. | Parâmetros do artigo oficial de embed (spec 020); testados no P3. |
| D2 | Consentimento antes do iframe: "O player é carregado **da Kick**, que pode coletar dados de uso conforme **a Política de Privacidade da Kick**", com link para `https://kick.com/privacy-policy` (respondeu `200` em 2026-11-27). | Mesma regra do YouTube e da Twitch (spec 016/032). |
| D3 | **Sem `loginNotice`** e **sem `minPlayer`**. | No P3 o player tocou sem login (≠ Twitch, spec 044). A Kick não documenta tamanho mínimo. |
| D4 | Nada é sobreposto ao iframe (ex.: nenhum selo por cima). | Developer Terms, Schedule 1 D: "Do not … cover, or obscure … embeddable experiences". O diálogo já põe tudo fora da área do iframe. |
| D5 | O e2e responde `player.kick.com` **dentro do próprio teste** (`page.route`). | `e2e/support.ts` não está na lista de arquivos da issue; nada sai para a Kick. |
| D6 | O e2e antigo "plataforma sem player embutido: modo só-link" (spec 025) usava a Kick; ele vira o e2e do player da Kick. O modo só-link continua coberto por teste unitário (`resolvePlayerView` com `platformEmbed: false`). | Não sobra plataforma sem embed. |

## Critérios de aceite

1. **CA1:** o iframe usa a URL oficial da Kick, com `autoplay=false` e `muted=true` (teste unitário).
2. **CA2:** o e2e abre o player de uma live da Kick (fixture), sem violação de CSP.
3. **CA3:** live encerrada na revalidação → sem iframe, com o estado e o link.
4. **CA4:** o diálogo continua acessível: `Esc` fecha, o foco volta ao card; movimento reduzido já coberto pela spec 015/042.

## Pendência

Testar num Preview da Vercel com a Kick ativa (fica para a #55, junto com a confirmação dos estados offline e inexistente da spec 049).

## Riscos e rollback

Rollback: `embed: false` na Kick em `lib/lives/platforms.ts`; o diálogo volta ao modo só-link.
