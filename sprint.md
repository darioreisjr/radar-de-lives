# Sprint de finalização — Radar de Lives

Objetivo: levar o projeto de "MVP no ar" para **100% finalizado**.
Cada tarefa abaixo é **independente**: pode ser feita sozinha, em qualquer ordem e em paralelo, por um agente ou por uma pessoa, sem esperar outra tarefa.

- Estado de partida: commit `73e7a3e` em `main`, site em produção em https://radardelives.darioreis.dev
- Documento criado em 2026-11-22.

---

## Sumário

| ID | Tarefa | Prioridade | Quem executa | Spec |
| --- | --- | --- | --- | --- |
| [S-01](#s-01--revisão-jurídica-de-privacidade-e-termos) | Revisão jurídica de privacidade e termos | P1 | Você + advogado(a) | — |
| [S-02](#s-02--itens-da-lgpd-na-política-de-privacidade) | Itens da LGPD na política de privacidade | P1 | Agente | `008-lgpd-privacy` |
| [S-03](#s-03--restringir-a-chave-do-youtube-no-google-cloud) | Restringir a chave do YouTube no Google Cloud | P1 | Você | — |
| [S-04](#s-04--ci-no-github-actions) | CI no GitHub Actions | P2 | Agente | `009-ci` |
| [S-05](#s-05--cabeçalhos-de-segurança-http) | Cabeçalhos de segurança HTTP | P2 | Agente | `010-security-headers` |
| [S-06](#s-06--atualizar-a-documentação-desatualizada) | Atualizar a documentação desatualizada | P2 | Agente | `011-docs-cleanup` |
| [S-07](#s-07--robotstxt-e-sitemapxml) | `robots.txt` e `sitemap.xml` | P3 | Agente | `012-seo-robots-sitemap` |
| [S-08](#s-08--licença-do-repositório) | Licença do repositório | P3 | Você decide, agente aplica | `013-license` |
| [S-09](#s-09--testes-de-interface-com-playwright) | Testes de interface com Playwright | P3 (opcional) | Agente | `014-ui-tests` |
| [S-10](#s-10--qa-manual-de-estados-e-movimento-reduzido) | QA manual de estados e movimento reduzido | P3 | Agente com navegador | `015-manual-qa` |
| [S-11](#s-11--aviso-de-consentimento-na-primeira-visita) | Aviso de consentimento na primeira visita | Condicional | Agente | `016-consent-notice` |
| [S-12](#s-12--política-de-segurança-de-conteúdo-csp) | Política de segurança de conteúdo (CSP) | P3 (opcional) | Agente | `017-csp` |
| [S-13](#s-13--alertas-de-uso-e-de-quota) | Alertas de uso e de quota | P3 | Você | — |
| [S-14](#s-14--pedido-de-aumento-de-quota-do-youtube) | Pedido de aumento de quota do YouTube | Condicional | Você (agente ajuda) | — |
| [S-15](#s-15--limpeza-local) | Limpeza local | P3 | Você | — |

**Prioridades:**
- **P1** bloqueia a divulgação pública.
- **P2** é robustez do projeto.
- **P3** é acabamento ou crescimento.
- **Condicional** só se executa se um gatilho acontecer; o gatilho está descrito na própria tarefa.

---

## Contexto do projeto (leia antes de qualquer tarefa)

**Produto:** diretório independente de lives públicas de GTA 6 no YouTube. A interface diz sempre "lives encontradas", nunca "todas", porque a busca não cobre tudo.

**Stack:**
- Next.js 16.4 (App Router, `cacheComponents: true`), React 19, TypeScript, Tailwind CSS 4.
- Zod, `@upstash/redis`, `@vercel/analytics`, Vitest 5.
- Gerenciador: **npm**.

**Hospedagem:**
- Vercel, ligada ao GitHub `darioreisjr/radar-de-lives` (público); cada push em `main` faz deploy em produção.
- Upstash Redis pelo Marketplace da Vercel.
- Domínio `radardelives.darioreis.dev`.

**Arquivos centrais:**

| Área | Arquivos |
| --- | --- |
| Rotas de API | `app/api/lives/route.ts`, `app/api/lives/[videoId]/route.ts` |
| YouTube, quota e cache | `lib/youtube/service.ts`, `lib/youtube/video-status.ts`, `lib/youtube/client.ts`, `lib/store/*` |
| Configuração do servidor | `lib/config/server-env.ts` (único lugar que lê `YOUTUBE_API_KEY`) |
| Configuração pública | `lib/config/site.ts` (nome, URL, responsável e contato legais) |
| Home | `app/page.tsx`, `components/hero/*`, `components/lives/*` (estado em `lives-provider.tsx`) |
| Páginas legais | `app/privacy/page.tsx`, `app/terms/page.tsx`, `components/legal/legal-page.tsx` |
| Design | `app/globals.css`, `lib/config/design-tokens.ts` |
| Next | `next.config.ts` |
| Telemetria | `lib/telemetry.ts` (eventos JSON no log) |

**Variáveis na Vercel (Production):**
- `YOUTUBE_API_KEY` (**só Production**).
- `NEXT_PUBLIC_SITE_URL`, `RATE_LIMIT_SECRET`.
- `KV_REST_API_URL` e `KV_REST_API_TOKEN` (Upstash).

**Quota do YouTube:** `search.list` tem cota própria de 100 chamadas/dia; o app limita a 90. Cada atualização gasta 1 `search.list` + 1 `videos.list`, e o cache dura 15 min.

**Processo:** Spec-Driven Development ([.claude/skills/sdd/SKILL.md](.claude/skills/sdd/SKILL.md)). Leia também [CLAUDE.md](CLAUDE.md), [README.md](README.md) e o [PRD](docs/product/PRD_Radar_de_Lives_GTA6.md).

---

## Regras para todas as tarefas

Estas regras existem para que as tarefas não se atrapalhem quando rodarem em paralelo.

### 1. Isolamento
- **Branch própria:** `sprint/<id-da-spec>`, por exemplo `sprint/009-ci`. Nunca commite direto em `main`.
- **Arquivos:** cada tarefa só altera os arquivos listados em "Arquivos que a tarefa pode alterar". Se precisar de outro, pare e pergunte ao usuário.
- **Arquivos compartilhados:** `README.md` e `CLAUDE.md` só são alterados pela **S-06**. As outras tarefas registram suas notas na própria spec, e a S-06 (ou uma rodada futura) consolida.
- **IDs de spec já reservados:** use exatamente o ID da tabela. Não crie outra pasta em `docs/specs/`.

### 2. Processo SDD
Antes de codar, crie `docs/specs/<id>/spec.md`, `plan.md` e `tasks.md`. Só marque `[x]` depois de verificar, e registre os resultados reais.

### 3. Verificação mínima antes do commit
```bash
npm run lint
npm run typecheck
npm test        # usa scripts/test.mjs (corrige d: vs D: do Vitest no Windows)
npm run build
```
Não enfraqueça nem apague testes para ficar verde.

### 4. Dependências npm
- Neste ambiente (Windows, npm 11), `npm install <pacote>` costuma **apagar do lockfile as bindings nativas do rolldown** (bug npm/cli#4828). O sintoma é `npm test` falhar com `rolldown-binding.wasi.cjs`.
- Correção: apague `node_modules` e `package-lock.json`, rode `npm install` e confirme com um diff do lockfile que **só o pacote novo** entrou e que nenhuma outra versão mudou.

### 5. Segredos
- Nunca leia, imprima, commite ou envie o valor de `YOUTUBE_API_KEY`, tokens do Upstash, `RATE_LIMIT_SECRET` ou `VERCEL_OIDC_TOKEN`.
- Antes de cada commit, confira que `.env.local` não está staged e que nenhum segredo aparece no diff.
- Agentes **não inserem chaves** em painéis ou formulários de serviços externos; isso fica com o usuário.

### 6. Quota do YouTube
- Testes locais com a chave real gastam a mesma quota da produção.
- Prefira simular respostas da API (fixtures ou interceptação de `fetch`/`page.route`).
- Se precisar de chamada real, avise antes.

### 7. Commits
- Conventional Commits em **pt-BR**, **sem** linha `Co-Authored-By`. Exemplo: `ci: adiciona workflow de lint, testes e build`.
- Autor: neste repositório o Git local já usa o e-mail noreply da conta `darioreisjr`. Não altere `user.name` nem `user.email`.

### 8. Push e PR
- **Só com autorização do usuário.**
- Push com a credencial do `gh` (conta `darioreisjr`), sem alterar a configuração global:
  ```bash
  git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin sprint/<id>
  ```
- Depois, abrir PR para `main`. A Vercel cria um **deploy de Preview** para a branch, protegido por login da Vercel e **sem** `YOUTUBE_API_KEY`: ali a busca mostra "Busca indisponível", o que é esperado.

### 9. Vercel CLI
- Para mudar os ambientes de uma variável, **não use `vercel env rm <nome> <ambiente>`**: ele apagou a variável de todos os ambientes.
- `vercel link` reescreve `.env.local` e o `.gitignore`. Confira com `git diff` e desfaça o que não for desejado.

### 10. Ao terminar
Atualize o `tasks.md` da sua spec e escreva no PR:
- o que mudou;
- as verificações feitas e seus resultados;
- o que ficou de fora.

---

## Definição de 100%

O projeto está finalizado quando:

- [x] S-01 concluída: textos legais revisados e publicados, sem pendência jurídica aberta. (Por decisão do usuário; pendências fora do código registradas na S-01.)
- [ ] S-02 concluída: política com os itens da LGPD.
- [x] S-03 concluída: chave restrita à YouTube Data API v3.
- [ ] S-04 concluída: CI verde em `main`.
- [ ] S-05 concluída: cabeçalhos de segurança em produção, com player, miniaturas e Analytics funcionando.
- [ ] S-06 concluída: specs e README sem pendências falsas.
- [ ] S-07 concluída: `robots.txt` e `sitemap.xml` em produção.
- [ ] S-08 concluída: licença decidida e aplicada (ou decisão registrada de não licenciar).
- [ ] S-10 concluída: estados e movimento reduzido verificados.
- [ ] S-13 concluída: alertas configurados.
- [x] S-11: executada (spec `016-consent-notice`).
- [ ] S-14: executada **ou** registrada como "não aplicável" com o motivo.
- [ ] S-09, S-12, S-15: executadas **ou** registradas como "adiada por decisão do usuário".

---

## S-01 — Revisão jurídica de privacidade e termos

- **Prioridade:** P1 · **Quem:** você, com um(a) advogado(a) · **Spec:** nenhuma (resultado vira entrada para S-02 e S-11)

**Contexto:** `/privacy` e `/terms` descrevem fielmente o que o código faz, mas foram escritos sem revisão jurídica. As Developer Policies do YouTube exigem uma política de privacidade que:
- informe o uso dos YouTube API Services;
- linke a Política de Privacidade do Google e os Termos do YouTube;
- esteja sempre acessível.

Elas também falam em o usuário "concordar" com a política antes de usar o site.

**Passos:**
1. Envie ao revisor:
   - https://radardelives.darioreis.dev/privacy
   - https://radardelives.darioreis.dev/terms
   - https://developers.google.com/youtube/terms/developer-policies
   - https://developers.google.com/youtube/terms/required-minimum-functionality
2. Peça resposta objetiva a estas perguntas:
   1. A política atende à **LGPD**? O que falta? (Veja o rascunho da S-02, se já existir.)
   2. Basta a política estar no rodapé e no aviso do player, ou é preciso um **aviso de consentimento na primeira visita**? (Se sim, executar a S-11.)
   3. As **miniaturas** carregam direto do Google (`i.ytimg.com`) sem consentimento prévio. Isso é aceitável?
   4. O **Vercel Web Analytics** (sem cookies, hash diário) exige consentimento?
   5. Qual **base legal** usar para o IP pseudonimizado no limite de requisições e para o Analytics?
   6. O responsável pode continuar como "Radar de Lives, projeto independente de fãs", ou precisa ser pessoa física ou jurídica identificada?
   7. Os termos protegem o projeto quanto a marcas (GTA, Rockstar, Take-Two, YouTube)?
3. Aplique as correções de texto em `app/privacy/page.tsx`, `app/terms/page.tsx` e, se mudar responsável ou contato, `lib/config/site.ts`, atualizando `siteConfig.legal.updatedAt`. Um agente pode aplicar o texto aprovado.

**Pronto quando:** o revisor aprovou, os textos aprovados estão em produção e as respostas 2 e 3 viraram decisão registrada (executar a S-11 ou marcá-la "não aplicável").

**Resultado (2026-11-22):** concluída **por decisão do usuário**.
- O usuário entregou o documento "Radar de Lives: respostas ao dossiê S-01 e minutas para revisão", com respostas às 7 perguntas e minutas de `/privacy` e `/terms`. O documento se declara minuta técnica, **não parecer jurídico**. Mesmo assim, o usuário decidiu publicar e considerar a S-01 concluída.
- Decisões registradas na spec `016-consent-notice`:
  - resposta 2: aceite afirmativo da política antes das funcionalidades → S-11 executada;
  - resposta 3: miniaturas só depois desse aceite;
  - resposta 4: Analytics continua sem depender do aceite;
  - resposta 6: controlador é "Dario Reis", pessoa física.
- Textos publicados em produção pelo PR #5 (`d55584d`); deploy da Vercel `success`; `/privacy` e `/terms` conferidas no ar.
- Regiões verificadas pela Vercel CLI: funções da Vercel e banco Upstash em `iad1` (Washington, D.C., EUA).
- **Pendências fora do código, com o usuário:**
  - confirmar com Vercel e Upstash o mecanismo de transferência internacional. O DPA da Upstash cita as cláusulas da Comissão Europeia, não as cláusulas-padrão da ANPD. Por isso a política não afirma conformidade com o art. 33.
  - preencher, datar e guardar o registro de legítimo interesse do limite de requisições.

---

## S-02 — Itens da LGPD na política de privacidade

- **Prioridade:** P1 · **Quem:** agente · **Spec:** `docs/specs/008-lgpd-privacy/`

**Contexto:** o site é brasileiro. A política atual tem as seções Resumo, Uso dos YouTube API Services, Dados tratados pelo site, Estatísticas de visitas, Conteúdo carregado do Google e Seus controles. Faltam os itens que a LGPD (Lei 13.709/2018) costuma exigir.

**Objetivo:** acrescentar um rascunho fiel ao comportamento real, marcado para revisão jurídica, com:
1. **Controlador e contato:** dados de `siteConfig.legal`.
2. **Finalidades e bases legais**, por tratamento:
   - IP pseudonimizado (HMAC) no limite de requisições: segurança e prevenção de abuso; base sugerida: legítimo interesse.
   - Vercel Web Analytics: estatísticas agregadas; base sugerida: legítimo interesse.
   - Player do YouTube: só após consentimento; base: consentimento.

   As bases são **sugestões** para o revisor, não afirmação jurídica.
3. **Compartilhamento e operadores:**
   - Vercel (hospedagem e Analytics);
   - Upstash (cache e limite de requisições);
   - Google/YouTube (API, miniaturas, player).
4. **Transferência internacional:** os serviços acima podem processar dados fora do Brasil (por exemplo, nos EUA).
5. **Retenção:**
   - hash do IP: até 60 s;
   - cache de dados públicos do YouTube: até cerca de 25 min;
   - Analytics: conforme a Vercel (sessão descartada em 24 h; relatórios pela janela do plano);
   - logs da hospedagem: conforme a Vercel.
6. **Direitos do titular** (art. 18): confirmação, acesso, correção, eliminação, informação sobre compartilhamento, revogação do consentimento. Diga como exercer, pelo e-mail de contato, e que o site não mantém cadastro.
7. **Atualizações da política** e data de vigência.

**Arquivos que a tarefa pode alterar:**
- `app/privacy/page.tsx`
- `lib/config/site.ts` (só `legal.updatedAt`)
- `docs/specs/008-lgpd-privacy/*`

**Restrições:**
- Não prometa o que o código não faz.
- Antes de escrever retenção ou serviços, confira em `lib/rate-limit/rate-limiter.ts`, `lib/lives/server.ts`, `lib/config/server-env.ts` e `components/analytics/site-analytics.tsx`.
- Não remova as seções existentes nem os links obrigatórios do Google e do YouTube.
- Mantenha o padrão visual de `LegalSection` e `ExternalLink`, sem caixa alta e sem `font-bold`.
- Não use dados pessoais além de `siteConfig.legal`.

**Critérios de aceite:**
1. A política contém as 7 seções acima, com textos fiéis ao código.
2. Continua citando "YouTube API Services" e os links `https://policies.google.com/privacy` e `https://www.youtube.com/t/terms`.
3. `npm run build` mostra `/privacy` como estática.
4. A spec lista as frases que dependem de validação jurídica.

**Verificação:**
```bash
npm run lint && npm run typecheck && npm test && npm run build
npm run dev   # abrir http://localhost:3000/privacy em 375 px e desktop
```

---

## S-03 — Restringir a chave do YouTube no Google Cloud

- **Prioridade:** P1 · **Quem:** você · **Spec:** nenhuma

**Contexto:** a chave roda no servidor da Vercel, que não tem IP fixo. Por isso a restrição de **aplicativo** fica "Nenhuma", e a proteção vem da restrição de **API**.

**Passos:**
1. https://console.cloud.google.com/ → projeto `radar-de-lives` → **APIs e serviços → Credenciais**.
2. Clique na chave usada pelo site.
3. **Restrições de aplicativo:** Nenhuma.
4. **Restrições de API:** "Restringir chave" → marque **somente** "YouTube Data API v3" → **Salvar**.
5. Em **APIs e serviços → YouTube Data API v3 → Cotas**, confirme o limite de `search.list` (padrão: 100/dia) e anote o valor.
6. Espere uns 5 minutos e abra https://radardelives.darioreis.dev, clicando em "Atualizar" depois de 15 min, se precisar. As lives devem continuar aparecendo. Se aparecer "O YouTube recusou a consulta", a restrição ficou na API errada.

**Pronto quando:** a chave está restrita só à YouTube Data API v3 e o site continua retornando lives.
**Opcional:** mande um print do painel **sem a chave visível** para um agente conferir.

**Resultado (2026-11-22):** concluída.
- Projeto `radar-de-lives` tem uma única chave ("Chave de API 1"). Restrições de aplicativo: Nenhuma. Restrições de API: somente "YouTube Data API v3". Salva por volta de 10:27 UTC; a lista de credenciais passou a mostrar a restrição.
- Cotas da YouTube Data API v3: "Search Queries per day" = **100** (uso no momento: 2); "Queries per day" = 10.000.
- Site depois da restrição: a primeira busca nova em produção, `GET /api/lives` às 10:34:50 UTC, respondeu `cached: false`, `source: "youtube"`, com 50 itens e sem erro.

---

## S-04 — CI no GitHub Actions

- **Prioridade:** P2 · **Quem:** agente · **Spec:** `docs/specs/009-ci/`

**Contexto:** hoje a Vercel só roda `next build`. Os testes Vitest, o lint e o typecheck **não rodam em nenhum push**. O repositório é público, então o Actions é gratuito.

**Objetivo:** um workflow que roda em todo push e PR para `main`:
1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. `npm run build`

**Arquivos que a tarefa pode alterar:**
- `.github/workflows/ci.yml` (novo)
- `docs/specs/009-ci/*`

**Detalhes obrigatórios:**
- **Versões das actions:** em 2026-11-22 as últimas eram `actions/checkout` **v7.0.1** e `actions/setup-node` **v7.1.0**. Confira de novo antes de usar:
  ```bash
  gh api repos/actions/checkout/releases/latest --jq .tag_name
  gh api repos/actions/setup-node/releases/latest --jq .tag_name
  ```
  Fixe pela versão maior (`@v7`) ou pelo SHA do commit, conforme a política que você registrar na spec.
- **Node:** 22.x, compatível com `engines` do Vitest 5 (`^22.12.0 || ^24`), com `cache: npm`.
- **Permissões mínimas:** `permissions: contents: read`.
- **`concurrency`:** cancelar execuções anteriores da mesma branch.
- **Sem segredos:** o build não precisa de `YOUTUBE_API_KEY`; sem ela, o app compila e a API responde "não configurada" em tempo de execução. **Não** adicione segredos ao repositório.
- **Lockfile:** o `package-lock.json` atual traz as bindings do rolldown para todas as plataformas, então `npm ci` deve funcionar no Linux. Se falhar por binding, investigue; não troque para `npm install`.
- `scripts/test.mjs` funciona no Linux (só normaliza a letra do drive no Windows).
- **Opcional:** `timeout-minutes: 15`.

**Critérios de aceite:**
1. O workflow roda num push para `sprint/009-ci` e fica verde.
2. Um teste quebrado de propósito, **numa branch descartável e sem merge**, faz o CI falhar. Registre o resultado e apague a branch.
3. Nenhum segredo no workflow.

**Verificação:**
- Valide o YAML localmente, se houver ferramenta disponível.
- Depois do push autorizado: `gh run list --branch sprint/009-ci` e `gh run view <id>`.

---

## S-05 — Cabeçalhos de segurança HTTP

- **Prioridade:** P2 · **Quem:** agente · **Spec:** `docs/specs/010-security-headers/`

**Contexto:** em produção só existe `Strict-Transport-Security`, adicionado pela Vercel. Leia antes a doc embutida: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md` e `poweredByHeader.md`.

**Objetivo:** aplicar a todas as rotas, via `headers()` em `next.config.ts`:

| Cabeçalho | Valor | Motivo |
| --- | --- | --- |
| `X-Content-Type-Options` | `nosniff` | Bloqueia detecção de tipo |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | **Obrigatório manter** este valor: o player do YouTube exige o `Referer` (Required Minimum Functionality). Não use `no-referrer` |
| `X-Frame-Options` | `DENY` | Impede o site de ser embutido em outros |
| `Content-Security-Policy` | `frame-ancestors 'none'` | Equivalente moderno do anterior. **Só esta diretiva** (a CSP completa é a S-12) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()` | Desliga recursos não usados. **Não** restrinja `fullscreen`, `picture-in-picture`, `encrypted-media` nem `autoplay`: o iframe do YouTube usa esses |

Além disso:
- `poweredByHeader: false` em `next.config.ts`.
- **Não** adicione `Cross-Origin-Embedder-Policy` nem `Cross-Origin-Opener-Policy: same-origin`: podem quebrar o iframe do YouTube e as miniaturas de `i.ytimg.com`.

**Arquivos que a tarefa pode alterar:**
- `next.config.ts`
- `docs/specs/010-security-headers/*`
- teste novo, opcional, em `tests/`

**Critérios de aceite:**
1. Em `next start` local, `curl -sI http://127.0.0.1:<porta>/` mostra os 5 cabeçalhos e não mostra `x-powered-by`.
2. Em `/api/lives` e `/opengraph-image` os cabeçalhos também aparecem e as respostas continuam corretas.
3. **Player:** na home, "Assistir aqui" → "Carregar player" carrega o iframe de `https://www.youtube.com/embed/...`.
   - Sem chave, use as fixtures; com interceptação de `fetch`, simule um item real e a revalidação.
   - **Não gaste quota.**
   - O console não tem erro de Permissions-Policy ou Referrer.
4. Miniaturas e o script do Analytics (`/<hash>/script.js`) continuam carregando.
5. lint, typecheck, testes e build verdes.

**Verificação em Preview** (depois do push autorizado): o Preview exige login da Vercel. Use `vercel curl` ou um navegador logado para conferir os cabeçalhos. Em produção, só depois do merge.

---

## S-06 — Atualizar a documentação desatualizada

- **Prioridade:** P2 · **Quem:** agente · **Spec:** `docs/specs/011-docs-cleanup/`

**Contexto:** várias pendências das specs já foram resolvidas depois, mas continuam abertas nos `tasks.md`. Esta tarefa é a **única** que altera `README.md` e `CLAUDE.md` nesta sprint.

**Arquivos que a tarefa pode alterar:**
- `docs/specs/001-foundation/tasks.md`
- `docs/specs/002-player-and-states/tasks.md`
- `docs/specs/003-launch-readiness/tasks.md`
- `docs/specs/004-real-key-validation/tasks.md`
- `docs/specs/005-shared-store/tasks.md`
- `README.md`
- `CLAUDE.md`
- `docs/specs/011-docs-cleanup/*`

**Itens a fechar, com a evidência a registrar:**

| Spec | Item aberto | Situação real e evidência |
| --- | --- | --- |
| 001 | Chamada real ao YouTube | Feita: 004 §2 (50 itens reais) e logs de produção em 005 |
| 001 | Contraste medido com ferramenta | Feito: `tests/contrast.test.ts` (spec 003) |
| 001 | Modo produção sem chave | Feito: spec 003 T7 (`next start` sem chave, "Busca indisponível") |
| 001 | `[!]` Cache compartilhado | Feito: spec 005 (Upstash) |
| 001 | `[!]` Nome final e domínio | Decidido: `radardelives.darioreis.dev` (`lib/config/site.ts`) |
| 001 / 002 | Reduced motion emulado; estados vistos na UI | Continuam abertos → apontar para a S-10 |
| 002 | Fluxo com chave e live real | Feito: logs de produção com `videos.list` de 1 ID após "Assistir aqui" (registrado na conversa de deploy; ver 005) |
| 002 | Erros dentro do player | Limitação aceita (002 D8), não é pendência |
| 002 | Testes de componente | Apontar para a S-09 |
| 002 | `[!]` Política de privacidade | Feita (spec 003); revisão jurídica → S-01 |
| 002 | `[!]` Cache compartilhado | Feito: spec 005 |
| 003 | `[!]` T8 cache, `[!]` T9 chave real | Feitos: specs 005 e 004 |
| 004 | Quota por atualização, "Assistir aqui", "Carregar mais" | Feitos em produção: `search.list` (`page: first` e `next`) e `videos.list` nos logs de 2026-11-22 |
| 005 | Remover `YOUTUBE_API_KEY` do Preview | Feito: a variável está só em Production (`vercel env ls`) |
| 005 | Restrição da chave no Google Cloud | Apontar para a S-03 |

**No README:**
- **Pendências:** lista apontando para este `sprint.md`.
- Adicionar um link para o `sprint.md` na seção "Desenvolvimento".

**No CLAUDE.md:**
- Uma linha: "Trabalho pendente organizado em `sprint.md`; cada tarefa usa a branch `sprint/<id>` e só altera os arquivos listados".

**Critérios de aceite:**
1. `grep -rnE "^\s*- \[ \]|^\s*- \[!\]" docs/specs` só retorna itens realmente abertos, cada um apontando para uma tarefa S-xx.
2. Nenhuma afirmação nova sem evidência. Se não conseguir confirmar algo, deixe aberto com nota.
3. Sem alteração de código.

---

## S-07 — `robots.txt` e `sitemap.xml`

- **Prioridade:** P3 · **Quem:** agente · **Spec:** `docs/specs/012-seo-robots-sitemap/`

**Contexto:** o site não tem `robots.txt` nem `sitemap.xml`. Leia a doc embutida em `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md` e `sitemap.md`.

**Objetivo:**
- **`app/robots.ts`:**
  - permitir tudo, exceto `/api/`;
  - apontar para `<URL>/sitemap.xml`.
- **`app/sitemap.ts`:**
  - páginas `/`, `/privacy` e `/terms`;
  - `/` com `changeFrequency: "hourly"`; as legais com `"monthly"`.
- **URL base:** `process.env.NEXT_PUBLIC_SITE_URL`, com `siteConfig.url` como alternativa, igual a `app/layout.tsx`.
- **Rotas estáticas:** não use APIs de requisição; deve aparecer `○` no build.

**Arquivos que a tarefa pode alterar:**
- `app/robots.ts` (novo)
- `app/sitemap.ts` (novo)
- teste opcional em `tests/`
- `docs/specs/012-seo-robots-sitemap/*`

**Critérios de aceite:**
1. `npm run build` lista `/robots.txt` e `/sitemap.xml` como estáticas.
2. Em `next start`:
   - `/robots.txt` contém `Disallow: /api/` e `Sitemap: https://radardelives.darioreis.dev/sitemap.xml` (com `NEXT_PUBLIC_SITE_URL` definida no build);
   - `/sitemap.xml` lista as 3 URLs absolutas no domínio final.
3. Nenhuma página privada ou de API no sitemap.

**Depois do deploy (você):** opcionalmente, envie o sitemap no Google Search Console.

---

## S-08 — Licença do repositório

- **Prioridade:** P3 · **Quem:** você decide, um agente aplica · **Spec:** `docs/specs/013-license/`

**Contexto:** o repositório é público e não tem `LICENSE`. Sem licença, todos os direitos ficam reservados e ninguém pode reutilizar o código legalmente.

**Decisão do usuário (o agente deve perguntar antes de aplicar):**

| Opção | Efeito |
| --- | --- |
| MIT | Uso livre, inclusive comercial, mantendo o aviso de copyright |
| Apache-2.0 | Como a MIT, com cláusula de patentes |
| AGPL-3.0 | Quem modificar e rodar como serviço precisa abrir o código |
| Sem licença | Mantém todos os direitos; registrar a decisão |

**Atenção:**
- A licença vale só para o **código**.
- Ela não cobre marcas (GTA, Rockstar, YouTube) nem miniaturas e metadados de terceiros exibidos pelo site.
- A skill `unslop` usada no visual é CC BY 4.0; o crédito já está no README e na spec 007, e precisa ser mantido.

**Arquivos que a tarefa pode alterar:**
- `LICENSE` (novo)
- `package.json` (**apenas** o campo `"license"`; mantenha `"private": true`)
- `docs/specs/013-license/*`

**Critérios de aceite:**
1. `LICENSE` com o texto oficial da licença escolhida, ano 2026 e titular informado pelo usuário.
2. O GitHub reconhece a licença na página do repositório depois do merge.
3. Se a escolha for "sem licença", a spec registra a decisão e nenhum arquivo é criado.

---

## S-09 — Testes de interface com Playwright

- **Prioridade:** P3 (opcional) · **Quem:** agente · **Spec:** `docs/specs/014-ui-tests/`

**Contexto:** os estados da tela são testados como funções puras (`explorer-state`, `player-state`, `radar-stats`) e foram verificados manualmente. Não existe teste automatizado do navegador. **Antes de começar, confirme com o usuário**, porque adiciona uma dependência pesada (`@playwright/test` + navegador).

**Objetivo:** testes e2e contra `next build && next start`, **sem chave e sem quota**, interceptando a API com `page.route("**/api/lives**", ...)`:
1. Home com lives: painel do radar mostra o total e os idiomas; existe um único botão com fundo rosa; não há rolagem horizontal em 375 px.
2. Estados: `quota_exceeded`, `upstream_unavailable` (com e sem itens), resposta `stale: true` e lista vazia.
3. Player: "Assistir aqui" → revalidação simulada (`live`, `ended`, `embedAllowed: false`) → consentimento → iframe com `https://www.youtube.com/embed/<id>?playsinline=1&rel=0` e **sem** `autoplay`.
4. Teclado: Tab chega aos filtros e às ações; Esc fecha o diálogo e o foco volta ao botão.
5. Movimento reduzido: `page.emulateMedia({ reducedMotion: "reduce" })` → animações com duração ≈ 0.

**Arquivos que a tarefa pode alterar:**
- `package.json` (só `devDependencies` e um script `test:e2e`)
- `package-lock.json`
- `playwright.config.ts` (novo)
- `e2e/*` (novo)
- `.gitignore` (só as pastas de saída do Playwright)
- `docs/specs/014-ui-tests/*`

**Restrições:**
- Siga a regra 4 sobre o lockfile.
- Não altere `vitest.config.mts`. O Vitest só lê `tests/**/*.test.ts`, então use `e2e/*.spec.ts` para não haver conflito.
- **Não** adicione o e2e ao CI nesta tarefa: o CI é a S-04. Registre na spec como seria a integração.

**Critérios de aceite:**
1. `npm run test:e2e` passa localmente.
2. Nenhuma requisição real a `googleapis.com` durante os testes (verifique com `page.on("request")`).
3. `npm test` (Vitest) continua com o mesmo número de testes.

---

## S-10 — QA manual de estados e movimento reduzido

- **Prioridade:** P3 · **Quem:** agente com navegador (Claude in Chrome) e você para a configuração do Windows · **Spec:** `docs/specs/015-manual-qa/`

**Contexto:** alguns estados nunca foram vistos na interface real:
- quota esgotada;
- erro;
- dados antigos (stale);
- live encerrada no player;
- `prefers-reduced-motion`.

Esta tarefa verifica e registra, **sem gastar quota**.

**Como simular sem quota** (no navegador, antes de clicar em "Atualizar"): substitua `window.fetch` para que `/api/lives` responda com:
- `{"error":{"code":"quota_exceeded",...}}` com status 503;
- `{"error":{"code":"upstream_unavailable",...}}` com status 502;
- `{"items":[...],"stale":true,...}`;
- `{"items":[],...}`.

Para o player, simule `/api/lives/<id>` com `state: "ended"`, `"upcoming"`, `"unavailable"` e `embedAllowed: false`. O mesmo método foi usado na spec 002, T10.

**Movimento reduzido:** em Windows → Configurações → Acessibilidade → Efeitos visuais → desligar "Efeitos de animação" (você). Depois o agente recarrega a página e confere que cards, hero e diálogo não animam e que o pulso do "ao vivo" para.

**Arquivos que a tarefa pode alterar:**
- `docs/specs/015-manual-qa/*` (capturas descritas em texto; não commitar prints com dados pessoais)

Se encontrar bug, **não corrija nesta tarefa**: registre na spec e proponha uma tarefa nova ao usuário.

**Critérios de aceite:** uma tabela na spec com estado, como foi simulado, resultado esperado, resultado observado e OK ou bug, cobrindo os 9 casos (4 da grade, 4 do player e movimento reduzido) em desktop e 375 px.

---

## S-11 — Aviso de consentimento na primeira visita

- **Prioridade:** condicional · **Quem:** agente · **Spec:** `docs/specs/016-consent-notice/`

**Gatilho:** só execute se a S-01 (revisão jurídica) concluir que é necessário consentimento ou aceite da política antes do uso. Sem esse resultado, **pergunte ao usuário** antes de começar.

**Objetivo**, conforme a orientação jurídica, que tem precedência sobre os itens abaixo:
- Aviso discreto na primeira visita com link para `/privacy`, botão "Entendi" (ou "Aceitar" e "Recusar", se exigido) e lembrança da escolha.
- **Onde guardar a escolha:** isso muda a frase "nada é salvo no navegador" da política. Ajuste a política na mesma tarefa.
- **Se houver recusa:**
  - não carregar o Analytics (renderizar `<SiteAnalytics />` só após aceite);
  - avaliar se as miniaturas devem esperar o aceite.
- Acessível: foco gerenciado, `role="dialog"` ou `region`, teclado e contraste dentro dos tokens.
- Visual da spec 007: neutro, sem rosa além da ação principal, sem caixa alta.

**Arquivos que a tarefa pode alterar:**
- componente novo em `components/consent/*`
- `app/layout.tsx`
- `components/analytics/site-analytics.tsx`
- `app/privacy/page.tsx`
- `docs/specs/016-consent-notice/*`

**Critérios de aceite:**
1. Na primeira visita o aviso aparece; depois da escolha, não aparece de novo.
2. Com recusa, nenhuma requisição ao script do Analytics.
3. A política descreve exatamente o que é guardado no navegador.
4. lint, typecheck, testes e build verdes; teste novo da lógica de consentimento.

**Resultado (2026-11-22):** concluída, spec `016-consent-notice`, PR #5 (`d55584d`), em produção.
- A S-01 foi o gatilho: resposta 2 do documento entregue pelo usuário.
- Tela "Li e concordo. Continuar" / "Não concordo" na home. Até o aceite, não há requisição a `/api/lives` nem a `i.ytimg.com`.
- O `localStorage` guarda só `{version, acceptedAt}`; nada vai ao servidor. A versão é `siteConfig.legal.updatedAt`: se a data mudar, o aceite é pedido de novo.
- Critérios:
  - 1 OK. Verificado no Chrome: o aviso não volta ao recarregar e volta se a versão guardada for antiga.
  - 2 **não aplicado**, por orientação do documento, que tem precedência. A resposta 4 conclui que o Analytics anônimo não exige consentimento, então o script carrega com ou sem aceite. A política diz isso.
  - 3 OK. A política descreve o que fica guardado no navegador.
  - 4 OK. lint, typecheck, 113 testes (7 novos) e build verdes; CI do PR verde.
- Também alterados, fora da lista acima: `app/page.tsx`, para o aceite envolver a home, e `components/legal/legal-page.tsx`, para o rótulo do controlador.

---

## S-12 — Política de segurança de conteúdo (CSP)

- **Prioridade:** P3 (opcional) · **Quem:** agente · **Spec:** `docs/specs/017-csp/`

**Contexto:** uma CSP completa reduz o impacto de XSS, mas pode quebrar o player, as miniaturas, o Analytics e os scripts do Next. Por isso fica separada da S-05.

**Objetivo:** primeiro `Content-Security-Policy-Report-Only` em produção; depois de validar, a versão aplicada.

Fontes conhecidas:

| Diretiva | Valores |
| --- | --- |
| `default-src` | `'self'` |
| `img-src` | `'self' data: https://i.ytimg.com` |
| `frame-src` | `https://www.youtube.com` |
| `script-src` | `'self'` + o que o Next exigir |
| `style-src` | `'self' 'unsafe-inline'` (avaliar) |
| `connect-src` | `'self'` |
| `font-src` | `'self'` (o `next/font` serve localmente) |
| `frame-ancestors` | `'none'` |
| `base-uri` | `'self'` |
| `form-action` | `'self'` |

Sobre os scripts:
- O Next 16 com Cache Components usa scripts inline. Leia o guia de CSP na doc embutida: `grep -ril "content security policy" node_modules/next/dist/docs` e decida entre nonce e hash.
- **Nonce torna as páginas dinâmicas**, o que pode afetar o prerender e o cache. Registre o impacto.
- O Analytics serve o script em `/<hash>/script.js` no próprio domínio, então ele já está coberto por `'self'`.

**Arquivos que a tarefa pode alterar:**
- `next.config.ts` (**só se a S-05 já estiver em `main`**; senão, prefira `proxy.ts`/middleware, conforme a doc, para não conflitar)
- `proxy.ts` (se usado)
- `docs/specs/017-csp/*`

**Critérios de aceite:**
1. Em Report-Only, nenhuma violação nos fluxos: home, filtros, carregar mais, player com consentimento, páginas legais e OG.
2. Só depois disso aplicar a versão definitiva, com aprovação do usuário.
3. Páginas que eram estáticas continuam estáticas, ou o impacto foi registrado e aceito pelo usuário.

---

## S-13 — Alertas de uso e de quota

- **Prioridade:** P3 · **Quem:** você · **Spec:** nenhuma

**Objetivo:** saber antes que um limite estoure.

**Passos:**
1. **Upstash** (https://console.upstash.com): no banco do projeto, ative alertas de uso perto do limite gratuito (500 mil comandos/mês), se o plano oferecer, e confira o e-mail de notificação.
2. **Vercel:** Settings → Billing/Usage → ative as notificações de uso (Analytics: 50 mil eventos/mês no Hobby; funções e banda).
3. **Google Cloud:** APIs e serviços → YouTube Data API v3 → Cotas → acompanhe o uso diário. Se quiser alerta por e-mail, crie em Monitoring → Alerting uma regra sobre o uso de quota da API.
4. **Logs do app:** na Vercel → Logs, filtre por `budget_exhausted` e `store_error`. Se aparecerem com frequência, é sinal para a S-14 ou para investigar o Upstash.

**Pronto quando:** os três painéis têm notificação ativa ou registrada como indisponível no plano.

---

## S-14 — Pedido de aumento de quota do YouTube

- **Prioridade:** condicional · **Quem:** você (um agente pode ajudar a redigir) · **Spec:** nenhuma

**Gatilho:** o evento `budget_exhausted` aparece nos logs de produção em dias normais, ou o painel do Google mostra `search.list` perto de 100/dia.

**Passos:**
1. Confirme a necessidade nos logs da Vercel (filtro `budget_exhausted`) e no painel de cotas do Google Cloud.
2. Preencha o formulário oficial de auditoria e extensão de quota da YouTube API Services. Procure por "YouTube API Services - Audit and Quota Extension Form" na ajuda do YouTube e confira o link vigente.
3. Material de apoio que um agente pode montar a partir do repositório:
   - descrição do uso (busca de lives públicas, sem login nem upload);
   - telas;
   - link da política de privacidade;
   - como o app protege a quota: cache de 15 min, limite diário, trava entre instâncias, rate limit;
   - estimativa de chamadas.
4. Depois da aprovação, ajuste `YOUTUBE_SEARCH_DAILY_BUDGET` na Vercel (Production) para ficar abaixo da nova cota e faça um redeploy.

**Pronto quando:** pedido enviado e resposta registrada, ou gatilho nunca ocorrido (registrar "não aplicável").

---

## S-15 — Limpeza local

- **Prioridade:** P3 · **Quem:** você · **Spec:** nenhuma

**Passos:**
1. No `.env.local`, apague a linha `VERCEL_OIDC_TOKEN=...`, que o `vercel link` acrescentou (token temporário de desenvolvimento). As outras variáveis ficam.
2. Opcional: se não for usar a Vercel CLI neste projeto, apague a pasta `.vercel/`; ela é ignorada pelo Git.
3. Opcional: rode `git status` e confirme que não há nada pendente.

**Pronto quando:** `.env.local` só tem as variáveis do `.env.example`, com seus valores.

---

## Como distribuir para agentes

- **Ao abrir cada agente, passe:**
  - o link deste arquivo;
  - o ID da tarefa (ex.: "execute a S-04 do `sprint.md`");
  - a autorização de push, se quiser que ele abra o PR.
- **Tarefas que podem rodar em paralelo sem conflito de arquivos:** S-02, S-04, S-05, S-06, S-07, S-08, S-09 e S-10.
  - Atenção: S-02 e S-11 alteram `app/privacy/page.tsx`. Se as duas forem executadas, faça o merge da S-02 primeiro ou resolva o conflito no PR.
- **Tarefas suas, sem agente:** S-01, S-03, S-13, S-14 e S-15.
- **Depois de cada merge em `main`:** confira o deploy (status da Vercel no commit) e o site (`/`, `/privacy`, `/terms`, `/api/lives`) e marque a tarefa na seção [Definição de 100%](#definição-de-100).
