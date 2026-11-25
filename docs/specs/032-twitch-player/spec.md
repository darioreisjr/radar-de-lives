# 032 — Player embutido da Twitch, com link de fallback

Issue [#44](https://github.com/darioreisjr/radar-de-lives/issues/44) · Épico [#28](https://github.com/darioreisjr/radar-de-lives/issues/28) · Fase 2 (Twitch) · Branch `sprint/032-twitch-player`

## Contexto

O diálogo já escolhe URL, textos e consentimento pela plataforma (spec 025), a CSP já libera `player.twitch.tv` (spec 031), e a revalidação da Twitch existe (spec 030). Falta ligar o player da Twitch, que hoje está em modo só-link (`embed: false`).

## Fatos

- **URL do player** (spec 019, doc oficial de embed): `https://player.twitch.tv/?channel=<login>&parent=<domínio>`.
  - `parent` é **obrigatório**;
  - `autoplay` vem `true` por padrão; `muted` vem `false`;
  - tamanho **mínimo de 400×300 px**.
- **Developer Agreement** (spec 019, Schedule 1 §D.1):
  - usar o player oficial;
  - não cobrir, modificar nem bloquear o player, seus anúncios ou as marcas da Twitch;
  - autoplay é opcional.
- **Aviso de privacidade da Twitch:** citado no próprio Developer Agreement como `https://www.twitch.tv/p/legal/privacy-notice`, que redireciona para `https://legal.twitch.com/legal/privacy-notice/` (conferido em 2026-11-25).

## Escopo

**Inclui**
- `PLATFORMS.twitch`:
  - `embed: true`;
  - `embedSrc` com `channel`, `parent=<hostname>`, `autoplay=false` e `muted=true`;
  - consentimento com o aviso de privacidade da Twitch;
  - tamanho mínimo do player.
- **Tamanho mínimo:**
  - estado `too_small` quando a tela não comporta 400 px de largura;
  - área do player com no mínimo 300 px de altura.
- O link "Abrir na Twitch" fica sempre visível (fallback).
- **e2e:**
  - player da Twitch no desktop (consentimento, iframe e CSP);
  - aviso de tela estreita no perfil de 375 px;
  - modo só-link passa a usar a Kick.

**Não inclui**
- Textos legais (#45).
- Player da Kick (#53).

## Decisões

| ID | Decisão | Motivo |
|---|---|---|
| D1 | `parent` = `window.location.hostname`, calculado no cliente (spec 025 D4). | Funciona em produção, Preview e `localhost` sem configuração (spec 019 I3). |
| D2 | `autoplay=false` e `muted=true` explícitos. | Mesma regra do YouTube (spec 002): o player só toca por ação da pessoa. Autoplay é opcional pelo acordo. |
| D3 | **Tamanho mínimo no mapa** (`minPlayer: { width: 400, height: 300 }`). O diálogo só monta o iframe se a largura da janela for de pelo menos 400 + 32 px (margens do diálogo); abaixo disso, estado `too_small` com o link. Com o iframe, a área do player tem `min-height` de 300 px. A largura é observada com `matchMedia`, e girar o celular atualiza na hora. | Exigência da Twitch (400×300); sem isso o player não funciona e pode violar o uso permitido. |
| D4 | O consentimento usa o aviso de privacidade da Twitch e é mostrado **antes** de carregar o iframe, como no YouTube. | PRD §12.5; spec 002 D3. |
| D5 | Nada é sobreposto ao iframe; o link de fallback fica fora da área do player. | Developer Agreement, Schedule 1 §D.1. |

## Critérios de aceite

1. **CA1:** o iframe usa a URL oficial da Twitch com `channel`, `parent=<hostname>`, `autoplay=false` e `muted=true` (unitário e e2e).
2. **CA2:** no desktop, o e2e abre o player de uma live da Twitch depois do consentimento, sem violação de CSP e sem requisição real à Twitch.
3. **CA3:** live encerrada na revalidação → não carrega o iframe, mostra o estado e mantém o link.
4. **CA4:** com menos de 432 px de largura, o diálogo não carrega o iframe e oferece "Abrir na Twitch". O diálogo continua acessível: foco preso, `Esc` fecha e o foco volta ao card.
5. **CA5:** o YouTube continua idêntico; o modo só-link continua funcionando para a Kick.

## Riscos

- **O `parent` não ser aceito em algum domínio do Preview.** Confirmar no Preview na #47.
- **Rollback:** voltar `PLATFORMS.twitch.embed` para `false`; o diálogo cai no modo só-link.
