# 002 — Player incorporado, revalidação e estados de live

Status: implementada e verificada (ver `tasks.md`) · Data: 2026-11-21
Fonte: [PRD](../../product/PRD_Radar_de_Lives_GTA6.md) §3 P0-8, P0-9, P0-11, §5 "Player incorporado". Continua [001](../001-foundation/spec.md).

## 1. Contexto

A 001 entregou a grade com "Assistir no YouTube". Faltam: o modal opcional com o player oficial (sempre aberto pela pessoa), o fallback quando a incorporação falha, e os estados "live encerrada" e "embed indisponível". Uma live pode terminar entre a busca e o clique, então o vídeo é conferido de novo ao abrir o player.

## 2. Objetivo

Ao clicar em "Assistir aqui", abrir um diálogo acessível que confere o estado atual do vídeo no servidor, pede consentimento antes de carregar conteúdo do YouTube e só então carrega o iframe oficial, sem autoplay. Sempre oferecer "Abrir no YouTube".

## 3. Escopo

### Incluído
- `GET /api/lives/[videoId]`: revalida um vídeo com `videos.list` (cache curto, orçamento diário, rate limit compartilhado).
- `LivePlayerDialog` com `<dialog>` nativo: foco preso, Esc, botão fechar, foco devolvido ao gatilho.
- Etapa de consentimento antes de carregar o iframe; lembrada só na sessão da página (memória, sem storage).
- Estados no diálogo: verificando, ao vivo, encerrada, agendada, indisponível, incorporação desativada, não verificado.
- Card marcado como "Encerrada" quando a revalidação detecta fim.
- Links no rodapé para os Termos do YouTube e a Política de Privacidade do Google.
- Testes unitários da revalidação, da máquina de estados do diálogo e do reducer da grade.

### Excluído
- Página `watch/[videoId]` (não é P0).
- Página própria de política de privacidade/termos (Fase 4; conteúdo é decisão do responsável pelo projeto) — **bloqueia lançamento** (§9).
- IFrame Player API (script de terceiros) para detectar erro dentro do player.
- Testes de componente com React Testing Library ou Playwright (ver D7).

## 4. Fatos da documentação oficial (consultada em 2026-11-21)

| Fonte | Fato |
| --- | --- |
| player_parameters | Embed: `https://www.youtube.com/embed/VIDEO_ID`. `autoplay` padrão `0`; com `1`, toca sem interação. **`mute` não é parâmetro documentado.** `playsinline=1` = reprodução inline no iOS. `rel=0` = relacionados do mesmo canal. Página não menciona `youtube-nocookie.com`. |
| player_parameters / RMF | Viewport do player ≥ **200×200 px**; recomendado ≥ 480×270 para 16:9. |
| Required Minimum Functionality | Player incorporado precisa enviar **`Referer`**; não usar `Referrer-Policy` que o suprima; recomendado `strict-origin-when-cross-origin`. |
| RMF | **Nada sobreposto** ao player, incluindo controles. Não modificar o player além do documentado. Autoplay só com mais da metade visível e um por vez. |
| Developer Policies | Cliente da API precisa de **política de privacidade** acessível, que informe o uso dos YouTube API Services, cite e linke a Política de Privacidade do Google; e linkar os Termos do YouTube (`https://www.youtube.com/t/terms`). Dados armazenados: atualizar ou apagar em até 30 dias (nosso cache dura minutos). |
| videos.list (001) | `liveBroadcastContent` `live/upcoming/none`; `actualEndTime` só após encerrar; `status.embeddable`; 1 unidade por chamada. |

## 5. Decisões (reversíveis)

- **D1 — Sem autoplay.** Como `mute` não está documentado, `autoplay=1` poderia tocar com som, o que o PRD proíbe. O iframe carrega parado; a pessoa aperta play.
- **D2 — URL do embed** `https://www.youtube.com/embed/{id}?playsinline=1&rel=0`, conforme a página oficial. `embedUrl` da 001 (`youtube-nocookie`) passa a seguir essa URL. A proteção de privacidade vem do consentimento (D3).
- **D3 — Consentimento antes do iframe.** O diálogo explica que o player é carregado do YouTube/Google e pode coletar dados; o iframe só é criado após "Carregar player". A escolha vale até recarregar a página.
- **D4 — `referrerPolicy="strict-origin-when-cross-origin"`** no iframe (exigência RMF). Os links "Assistir no YouTube" continuam com `rel="noopener noreferrer"` (PRD P0-8): são navegação para youtube.com, não player incorporado.
- **D5 — Revalidação automática ao abrir o diálogo** (a pessoa já agiu): `GET /api/lives/[videoId]`, cache de 60 s por vídeo, single-flight, orçamento `YOUTUBE_DETAILS_DAILY_BUDGET` (padrão 2000 unidades/dia, de 10.000 compartilhadas), mesmo rate limit de 30 req/min/IP.
- **D6 — Falha na revalidação não bloqueia.** Sem chave, quota, timeout: o diálogo mostra "Não conseguimos confirmar se a live continua" e permite carregar o player e abrir no YouTube.
- **D7 — Sem nova dependência de testes de componente.** A lógica de estados vive em funções puras testadas com Vitest; a UI é conferida no navegador. RTL/Playwright fica para decisão futura.
- **D8 — Detecção de erro dentro do player não é possível** sem a IFrame Player API. Mitigação: o link "Abrir no YouTube" fica sempre visível abaixo do player, com o texto "Se o player não carregar, abra no YouTube".
- **D10 — Placeholder sem miniatura** diz "Sem miniatura" em itens reais e "Simulado" só em fixtures (achado na verificação).
- **D9 — Itens simulados** abrem o diálogo em modo "simulado", sem rede e sem iframe, para conferência visual.

## 6. Requisitos

- **RF1** `GET /api/lives/[videoId]` valida `videoId` (`[A-Za-z0-9_-]{6,20}`) → `400 invalid_params` se inválido.
- **RF2** Resposta `200`: `{ videoId, state: "live"|"ended"|"upcoming"|"unavailable", embedAllowed: boolean|"unknown", concurrentViewers: number|null, checkedAt, cached }`.
- **RF3** Mapeamento: sem item → `unavailable`; `actualEndTime` ou `liveBroadcastContent: none` → `ended`; `upcoming` → `upcoming`; senão `live`.
- **RF4** Erros com os mesmos códigos e mensagens seguras da 001.
- **RF5** Card ganha "Assistir aqui" (abre diálogo) ao lado de "Assistir no YouTube"; quando `embedAllowed === false`, o botão não aparece e o card diz "Incorporação desativada pelo canal".
- **RF6** Diálogo: título com o nome da live, canal, estado, botão fechar fora da área do player, link "Abrir no YouTube" sempre visível (exceto simulado).
- **RF7** Iframe: `title="Player do YouTube: {título}"`, `allow="encrypted-media; picture-in-picture; fullscreen"`, `allowFullScreen`, `referrerPolicy` conforme D4, área ≥ 200 px de altura, sem sobreposição.
- **RF8** Estado `ended` na revalidação marca o card como "Encerrada" (badge) na grade.
- **RF9** Rodapé linka Termos do YouTube e Política de Privacidade do Google.
- **RNF1** Esc e botão fechar encerram o diálogo; foco volta ao botão que o abriu; fundo não rola.
- **RNF2** Animação de abertura: fade + escala curta (≤ 240 ms), removida com reduced motion.

## 7. Critérios de aceite

1. **CA1** O iframe só existe no DOM depois de clicar em "Carregar player".
2. **CA2** A URL do iframe é `https://www.youtube.com/embed/{id}` sem `autoplay=1`.
3. **CA3** `GET /api/lives/abc` (curto/ inválido) → 400; sem chave → 503 `missing_api_key`.
4. **CA4** Revalidação mapeia live/encerrada/agendada/indisponível conforme RF3 (testes).
5. **CA5** Dentro de 60 s, revalidar o mesmo vídeo não chama o YouTube (teste).
6. **CA6** Revalidação que falha mostra "não confirmado" e ainda permite carregar e abrir no YouTube (teste da máquina de estados).
7. **CA7** `embedAllowed: false` (lista ou revalidação) mostra fallback sem iframe (teste + UI).
8. **CA8** Esc fecha; foco volta ao gatilho (navegador).
9. **CA9** Item revalidado como encerrado mostra "Encerrada" no card (teste do reducer).
10. **CA10** Player em 375 px tem altura ≥ 200 px e nenhum elemento sobre ele (navegador).
11. **CA11** lint, typecheck, testes e build passam.

## 8. Estados do diálogo

| Estado | Conteúdo | Ações |
| --- | --- | --- |
| Verificando | "Conferindo se a live continua…" | Abrir no YouTube, Fechar |
| Consentimento | Aviso sobre conteúdo do YouTube/Google | Carregar player, Abrir no YouTube |
| Player | iframe | Abrir no YouTube, Fechar |
| Encerrada | "Esta live terminou" | Abrir no YouTube (pode ter replay) |
| Agendada | "Ainda não começou" | Abrir no YouTube |
| Indisponível | "Vídeo privado, removido ou indisponível" | Abrir no YouTube, Fechar |
| Embed desativado | "O canal não permite incorporar" | Abrir no YouTube |
| Não verificado | Aviso + consentimento | Carregar player, Abrir no YouTube |
| Simulado | "Item de exemplo, sem vídeo" | Fechar |

## 9. Riscos e bloqueios

- **Bloqueia lançamento:** política de privacidade própria exigida pelas Developer Policies (Fase 4). Precisa de decisão/conteúdo do responsável pelo projeto.
- Embed pode falhar por Content ID/região sem que o app saiba (D8).
- Revalidação consome unidades do bucket de 10.000/dia; limitada por D5.
