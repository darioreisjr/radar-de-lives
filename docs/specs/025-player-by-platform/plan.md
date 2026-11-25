# 025 — Plano

## Passos

1. **`lib/lives/platforms.ts`** (novo): `PLATFORMS: Record<Platform, PlatformMeta>`.
   - YouTube: `embed: true`, URL atual do iframe, consentimento do Google;
   - Twitch e Kick: `embed: false`, sem consentimento por enquanto (D2).
2. **`lib/lives/player-state.ts`:**
   - `StatusCheck` usa `LiveStatusPayload`;
   - `resolvePlayerView` recebe `platformEmbed` e devolve `link_only` quando for `false`;
   - `embedSrc(item, { hostname })` delega ao mapa.
3. **`lib/lives/explorer-state.ts`:** `item-status` com `LiveStatusPayload`, casando pelo `id` (`liveId(platform, sourceId)`).
4. **`components/lives/live-player-dialog.tsx`:**
   - rota `/api/status/<platform>/<id>`;
   - textos, link e consentimento vindos do mapa;
   - tela `link_only`.
5. **`components/lives/live-card.tsx`:** texto do link externo vindo do mapa ("YouTube" e "Abrir no YouTube" iguais aos de hoje).
6. **Testes:**
   - `tests/player-state.test.ts`: `embedSrc` igual ao de hoje; `link_only`;
   - `tests/explorer-state.test.ts`: status no formato novo; não casar plataforma diferente;
   - `e2e/support.ts`: simular `/api/status/<platform>/<id>` e incluir `platform` e `sourceId` no status simulado;
   - `e2e/player.spec.ts`: rota nova e modo só-link.

## Arquivos

- **Novo:** `lib/lives/platforms.ts`
- **Alterados:** `lib/lives/player-state.ts`, `lib/lives/explorer-state.ts`, `components/lives/live-player-dialog.tsx`, `components/lives/live-card.tsx`, `components/lives/live-explorer.tsx` (só o tipo), `tests/player-state.test.ts`, `tests/explorer-state.test.ts`, `e2e/support.ts`, `e2e/player.spec.ts`

Fora da lista da issue, com motivo:
- `explorer-state.ts` e o teste dele: o reducer casa o status recebido com o item.
- `e2e/support.ts`: simula a rota nova.

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`.
