# 024 — Tarefas

- [x] `LiveState` e `LiveStatusPayload` em `lib/lives/types.ts`. (D3)
- [x] Capacidade opcional `status` no `LivesProvider`; o provedor do YouTube a implementa com `VIDEO_ID` e o `VideoStatusService` atual. (D5)
- [x] `lib/lives/status-handler.ts`: rate limit, plataforma ativa com `status`, validação do id, provedor; erros iguais aos de hoje. (D1, D2, D4)
- [x] Rotas:
  - nova `app/api/status/[platform]/[id]/route.ts`;
  - `app/api/lives/[videoId]/route.ts` delega com `idLabel` e o rótulo de log antigos (`@deprecated`).
- [x] `server.ts`: guarda os provedores ativos e expõe `getStatusHandler()`.
- [x] Vitest: alias de `server-only` para `tests/stubs/server-only.ts`. (D6)
- [x] `tests/status-route.test.ts`: 6 testes, incluindo as rotas reais importadas (sem chave do YouTube). (CA1 a CA5)
- [x] Verificação em 2026-11-25:
  - lint e typecheck: ok;
  - `npm test`: 19 arquivos, 174 testes;
  - build e `npm run test:e2e`: 46 testes;
  - **Servidor real** (`next start`, sem `YOUTUBE_API_KEY`):
    - `/api/lives/<id>` e `/api/status/youtube/<id>` → mesma resposta (`503 missing_api_key`);
    - `/api/status/twitch/canal` → `400 plataforma inválida`;
    - `/api/status/youtube/x!` → `400 id inválido`;
    - `/api/lives/x!` → `400 videoId inválido` (mensagem antiga mantida).
