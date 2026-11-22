# 006 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente

- [x] T1 `@vercel/analytics@^2.0.1` instalado; lockfile regenerado (contorno npm/cli#4828): só o pacote novo entrou, 0 versões alteradas, 17 bindings
- [x] T2 `lib/analytics.ts` (`stripQuery`) + `components/analytics/site-analytics.tsx` (client) no layout raiz — CA1
- [x] T3 `/privacy`: resumo e seção "Estatísticas de visitas" — CA2
- [x] T4 lint ok · typecheck ok · testes 103/103 · build ok — CA3
- [x] T5 Commit `aa962ca` + push (autor darioreisjr, sem segredos); deploy Vercel `success`; `/_vercel/insights/script.js` → 200 em produção; `/privacy` com a seção nova — CA4, CA5
- [x] T6 Script da Vercel só grava em `localStorage` se o site identificar usuário (`userId`/`groupId`), o que não fazemos; a frase "nada é salvo no navegador" continua correta.

## Pendência do usuário
- [ ] Confirmar que **Analytics → Enable** está ativo no painel e ver as primeiras visitas (podem levar ~30 s; bloqueadores de anúncio impedem a contagem).
