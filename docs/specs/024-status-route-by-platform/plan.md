# 024 — Plano

## Passos

1. **`lib/lives/types.ts`:** `LiveState` e `LiveStatusPayload` (D3).
2. **`lib/lives/providers/types.ts`:** capacidade opcional `status?: { isValidId(id); getStatus(id) }`.
3. **`lib/lives/providers/youtube.ts`:** recebe o `VideoStatusService` e expõe `status`, validando com `VIDEO_ID` e completando `platform` e `sourceId` (D5).
4. **`lib/lives/status-handler.ts`** (novo):
   - `createStatusHandler({ rateLimit, providers, log })` → `handle(request, platform, id, { idLabel, route })`;
   - ordem: rate limit, plataforma ativa com `status`, validação do id, provedor (D1, D2, D4).
5. **`lib/lives/server.ts`:**
   - guarda os provedores selecionados no runtime;
   - expõe `getStatusHandler()`;
   - passa o `VideoStatusService` ao provedor do YouTube.
6. **Rotas:**
   - nova `app/api/status/[platform]/[id]/route.ts`;
   - `app/api/lives/[videoId]/route.ts` delega com `idLabel: "videoId"` e `route: "/api/lives/[videoId]"`.
7. **Vitest:** alias de `server-only` para `tests/stubs/server-only.ts` (D6).
8. **Testes** (`tests/status-route.test.ts`): handler com rate limiter em memória, provedor do YouTube real sobre `fetch` falso, e provedor falso de outra plataforma. CA1 a CA5.

## Arquivos

- **Novos:** `app/api/status/[platform]/[id]/route.ts`, `lib/lives/status-handler.ts`, `tests/status-route.test.ts`, `tests/stubs/server-only.ts`
- **Alterados:** `app/api/lives/[videoId]/route.ts`, `lib/lives/providers/types.ts`, `lib/lives/providers/youtube.ts`, `lib/lives/server.ts`, `lib/lives/types.ts`, `vitest.config.mts`

Fora da lista da issue, com motivo:
- `lib/lives/status-handler.ts`: o handler é compartilhado pelas duas rotas e precisa ser testável.
- `vitest.config.mts` e `tests/stubs/server-only.ts`: necessários para os testes de rota do plano (seção 5.1).

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e` e chamada real às duas rotas no servidor local (`next start`).
