# 049 — Plano

1. **`lib/kick/status.ts`:** `KICK_SLUG`, schema mínimo (D2), `createKickStatusService({ client, cache, ttlMs })` com cache de 60 s, single-flight e mapeamento D3.
2. **`lib/lives/providers/kick.ts`:** `createKickProvider(service, statusService?)` com `status` (`isValidId` = `KICK_SLUG`).
3. **`lib/lives/server.ts`:** serviço de status com `status:kick` (500 entradas, 60 s). (D7, a confirmar)
4. **`tests/kick-status.test.ts`:** CA1 a CA5, store fora, erro do cliente, rota pelo handler (ativa, id inválido, sem revalidação, inativa).

## Arquivos

- **Novos:** `lib/kick/status.ts`, `tests/kick-status.test.ts`, `docs/specs/049-kick-status/*`
- **Alterados:** `lib/lives/providers/kick.ts`, `tests/kick-service.test.ts` (o teste "sem revalidação de status" da 048 muda)
- **A confirmar:** `lib/lives/server.ts`

## Verificação

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`.
