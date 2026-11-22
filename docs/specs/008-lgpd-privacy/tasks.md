# 008 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente

- [x] T1 Conferir no código os fatos de retenção e serviços (`lib/rate-limit/rate-limiter.ts`, `lib/lives/http.ts`, `lib/lives/server.ts`, `lib/config/server-env.ts`, `components/analytics/site-analytics.tsx`): HMAC do IP com TTL de 60 s; cache 900 s + stale 600 s = 25 min; Analytics só page views sem query — registrado na spec
- [x] T2 `/privacy`: seções "Controlador e contato" (R1), "Finalidades e bases legais" (R2), "Compartilhamento e operadores" (R3), "Transferência internacional" (R4), "Por quanto tempo guardamos" (R5), "Seus direitos" (R6) e "Atualizações desta política" (R7); seções existentes mantidas — CA1
- [x] T3 `siteConfig.legal.updatedAt` → `2026-11-22` (aparece também em `/terms`, que usa o mesmo `LegalPage`)
- [x] T4 Lista de frases para validação jurídica na spec — CA4
- [x] T5 lint ok · typecheck ok · testes 106/106 · build ok, `○ /privacy` estática — CA3, CA5
- [x] T6 `next start` local: HTML de `/privacy` contém as 13 seções na ordem do plano, "YouTube API Services", `https://policies.google.com/privacy`, `https://www.youtube.com/t/terms`, `mailto:` do contato e a data "22 de novembro de 2026"; sem "Versão preliminar" — CA2
- [x] T7 Visual: desktop (1920 px) e 375 px (iframe de 375 px) sem rolagem horizontal (`scrollWidth` 360 ≤ 375), sem caixa alta, padrão `LegalSection`/`ExternalLink` mantido
- [ ] T8 Revisão jurídica do texto → S-01 do `sprint.md`
