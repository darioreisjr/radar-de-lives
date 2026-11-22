# 016 — Plano

## Abordagem

- `lib/consent/policy-acceptance.ts`: funções puras e tolerantes a falha para ler, validar e gravar o aceite.
- `components/consent/policy-gate.tsx` (client): `useSyncExternalStore` lê o `localStorage` (snapshot do servidor =
  `null`, sem piscar o aviso para quem já aceitou). Envolve `<LivesProvider>` em `app/page.tsx`, então nada é buscado
  nem renderizado antes do aceite. Após aceitar, o foco vai para o conteúdo liberado.
- Textos: `app/privacy/page.tsx` e `app/terms/page.tsx` a partir das minutas; `lib/config/site.ts` com o controlador;
  `components/legal/legal-page.tsx` com rótulo "Responsável (controlador dos dados)".

## Arquivos

| Arquivo | Mudança |
| --- | --- |
| `lib/consent/policy-acceptance.ts` | novo |
| `components/consent/policy-gate.tsx` | novo |
| `tests/policy-acceptance.test.ts` | novo |
| `app/page.tsx` | envolve a home com `PolicyGate` |
| `app/privacy/page.tsx`, `app/terms/page.tsx` | textos das minutas |
| `lib/config/site.ts` | `legal.controller` |
| `components/legal/legal-page.tsx` | rótulo do bloco de responsável |

`app/page.tsx` e `components/legal/legal-page.tsx` estão fora da lista da S-11 no `sprint.md`; foram necessários para
o aceite envolver a home e para o rótulo do controlador.

## Verificação

lint, typecheck, `npm test`, `npm run build`; `next dev` sem chave (fixtures, sem quota) no Chrome: primeira visita,
recusa, aceite, recarga, versão antiga, 375 px.

## Rollback

Reverter o commit. O valor no `localStorage` dos visitantes fica inofensivo.
