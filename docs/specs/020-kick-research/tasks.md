# 020 — Tarefas do spike da Kick

- [x] Ler a documentação oficial: OAuth, App Setup, Livestreams, Categories, FAQ, changelog. (CA1)
- [x] Extrair da OpenAPI os contratos de `/public/v2/livestreams`, `/public/v1/users/livestreams` e `/public/v2/categories`. (CA1, CA3)
- [x] Ler o artigo oficial de embed. (CA1)
- [x] Testar a rede sem credenciais: `401` JSON via Cloudflare, sem desafio; player sem `X-Frame-Options`. Feito em 2026-11-25. (CA1)
- [x] Montar a tabela de mapeamento Kick → `LiveItem`. (CA3)
- [x] Registrar a recomendação provisória: seguir com ressalvas. (CA4)
- [x] **P1:** `category_id` de GTA 6 = `13155` (2026-11-27).
- [x] **P2:** 1815 lives em 2 páginas; ordem do mais antigo; `slug` = usuário; miniaturas em `images.kick.com` e `web.kick.com`; `expires_in` 60 dias; fixture anonimizada em `tests/fixtures/kick/livestreams-v2.json` (2026-11-27).
- [ ] **P3:** teste a partir de um Preview da Vercel. Precisa da sua autorização para o deploy e das credenciais em Preview. (CA2)
- [x] **P4:** Developer Terms lidos (dev.kick.com/terms-of-service), com as condições registradas na spec (2026-11-27).
- [x] Decisão D-K1: sem selo "Conteúdo adulto" na Kick (98% da categoria vem marcada).
- [ ] Recomendação final (seguir, adiar ou não seguir) depois de P3.
