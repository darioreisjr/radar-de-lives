# 020 — Tarefas do spike da Kick

- [x] Ler a documentação oficial: OAuth, App Setup, Livestreams, Categories, FAQ, changelog. (CA1)
- [x] Extrair da OpenAPI os contratos de `/public/v2/livestreams`, `/public/v1/users/livestreams` e `/public/v2/categories`. (CA1, CA3)
- [x] Ler o artigo oficial de embed. (CA1)
- [x] Testar a rede sem credenciais: `401` JSON via Cloudflare, sem desafio; player sem `X-Frame-Options`. Feito em 2026-11-25. (CA1)
- [x] Montar a tabela de mapeamento Kick → `LiveItem`. (CA3)
- [x] Registrar a recomendação provisória: seguir com ressalvas. (CA4)
- [ ] **P1:** `category_id` de GTA 6. Precisa do app da Kick criado por você.
- [ ] **P2:** resposta real: volume, `slug` igual ao usuário, domínio das miniaturas, `expires_in`; e a fixture anonimizada em `tests/fixtures/kick/`.
- [ ] **P3:** teste a partir de um Preview da Vercel. Precisa da sua autorização para o deploy e das credenciais em Preview. (CA2)
- [ ] **P4:** link ou texto dos Developer Terms da Kick.
- [ ] Recomendação final (seguir, adiar ou não seguir) depois de P1 a P4.
