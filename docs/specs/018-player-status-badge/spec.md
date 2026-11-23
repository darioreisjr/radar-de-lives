# 018 — Selo do player conforme o estado revalidado

Correção do bug **B1** encontrado na S-10 (spec 015). Branch `sprint/018-player-status-badge`.

## Problema

No diálogo do player, o selo do cabeçalho só distinguia "ao vivo" de "encerrada". Com a revalidação `upcoming` ou `unavailable`, o diálogo mostrava "Encerrada" ao lado de "Ainda não começou" ou "Vídeo indisponível".

## Objetivo

O selo segue o estado revalidado: "Ao vivo", "Encerrada", "Agendada", "Indisponível" ou "Simulado". Sem revalidação (pendente ou com erro), usa o estado da lista, como antes.

## Escopo

Incluído: `playerBadge()` em `lib/lives/player-state.ts`; o selo em `components/lives/live-player-dialog.tsx`; testes unitários e e2e.
Excluído: o card da grade (continua "Encerrada" depois de uma revalidação que não seja `live`; caso raro, porque a busca só retorna lives em andamento).

## Critérios de aceite

1. **CA1** `upcoming` → selo "Agendada"; `unavailable` → "Indisponível"; `ended` → "Encerrada"; `live` → "Ao vivo".
2. **CA2** Sem revalidação, o selo usa `isLive` da lista.
3. **CA3** lint, typecheck, Vitest, e2e e build verdes; rotas sem mudança.
