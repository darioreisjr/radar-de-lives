# 002 — Plano técnico

## Abordagem

- **Servidor:** `lib/youtube/video-status.ts` com `videoStatusFrom()` puro e `createVideoStatusService()` (cache 60 s, single-flight, orçamento diário). Reaproveita `createYoutubeClient().videoDetails`, `MemoryCache` e `LivesError`. O contador diário sai de `service.ts` para `lib/youtube/daily-budget.ts` e é usado pelos dois serviços.
- **Rota:** `app/api/lives/[videoId]/route.ts` com `RouteContext<"/api/lives/[videoId]">` e `await ctx.params` (doc embutida do Next 16.4). Mesmo rate limit de `lib/lives/server.ts`.
- **Cliente:**
  - `lib/lives/player-state.ts`: `resolvePlayerView()` puro.
  - `lib/lives/explorer-state.ts`: reducer da grade extraído de `live-explorer.tsx` + ação `item-status`.
  - `components/lives/live-player-dialog.tsx`: `<dialog>` nativo com `showModal()`; montado com `key={videoId}`; busca status em efeito com `AbortController`.
  - `LiveCard` ganha `onWatchHere` e estado "Encerrada".
- **Embed URL:** `normalize.ts` passa a gerar `https://www.youtube.com/embed/{id}`; o diálogo acrescenta `playsinline=1&rel=0`.

## Arquivos

Novos: `lib/youtube/daily-budget.ts`, `lib/youtube/video-status.ts`, `app/api/lives/[videoId]/route.ts`, `lib/lives/player-state.ts`, `lib/lives/explorer-state.ts`, `components/lives/live-player-dialog.tsx`, `tests/video-status.test.ts`, `tests/player-state.test.ts`, `tests/explorer-state.test.ts`.
Alterados: `lib/youtube/service.ts`, `lib/youtube/normalize.ts`, `lib/youtube/types.ts`, `lib/lives/server.ts`, `lib/config/server-env.ts`, `components/lives/live-explorer.tsx`, `components/lives/live-card.tsx`, `components/layout/site-footer.tsx`, `app/globals.css`, `.env.example`, `README.md`.

## Variáveis

`YOUTUBE_DETAILS_DAILY_BUDGET=2000` (nova).

## Verificação

Vitest (estados e serviço), curl na rota, Chrome: abrir diálogo com item simulado, Esc/foco, 375 px; lint, typecheck, build.

## Rollback

Remover a rota e o diálogo; o card volta a ter só o link.
