# 008 — Itens da LGPD na política de privacidade

Tarefa S-02 do [sprint.md](../../../sprint.md). Branch `sprint/008-lgpd-privacy`.

## Contexto

O site é brasileiro e `/privacy` (spec 003, 006) descreve fielmente o que o código faz, mas não traz os itens que a LGPD (Lei 13.709/2018) costuma exigir: controlador, finalidades e bases legais, compartilhamento, transferência internacional, retenção, direitos do titular e vigência.

## Objetivo

Acrescentar à política um **rascunho** desses itens, fiel ao comportamento real e marcado para revisão jurídica (S-01). As bases legais são **sugestões** para o revisor, não afirmação jurídica.

## Escopo

Incluído:
- `app/privacy/page.tsx`: novas seções LGPD.
- `lib/config/site.ts`: só `legal.updatedAt`.
- Esta spec.

Excluído:
- Aviso de consentimento na primeira visita (S-11).
- Termos de uso, `README.md`, `CLAUDE.md`.
- Qualquer mudança de comportamento do código.

## Fatos confirmados no código (base do texto)

| Tratamento | Onde | Fato |
| --- | --- | --- |
| IP no limite de requisições | `lib/lives/http.ts`, `lib/rate-limit/rate-limiter.ts`, `lib/lives/server.ts` | IP vem de `x-forwarded-for`/`x-real-ip`; vira HMAC-SHA256 (truncado) com `RATE_LIMIT_SECRET`; chave `rl:<hash>:<janela>` com TTL igual à janela de 60 s; limite 30/min. O IP em claro não vai ao store. |
| Cache de dados públicos do YouTube | `lib/config/server-env.ts`, `lib/lives/server.ts` | `LIVE_CACHE_TTL_SECONDS` 900 + `LIVE_STALE_TTL_SECONDS` 600 = até 25 min; status do vídeo: 60 s. Sem dados de visitantes. |
| Analytics | `components/analytics/site-analytics.tsx`, `lib/analytics.ts`, spec 006 | Vercel Web Analytics, só page views, URL sem query string; sem `userId`; sessão descartada em 24 h segundo a Vercel. |
| Player | `components/lives/*`, spec 002 | iframe do YouTube só depois do clique em "Carregar player". |
| Miniaturas | spec 003 | Carregadas direto de `i.ytimg.com`. |
| Logs | `lib/telemetry.ts` | Eventos JSON sem IP; a Vercel mantém registros de acesso próprios. |
| Conta/cadastro | — | Não existe. |

## Requisitos

1. **R1 Controlador e contato:** usa `siteConfig.legal.controller` e `siteConfig.legal.contact`.
2. **R2 Finalidades e bases legais** por tratamento: IP pseudonimizado (legítimo interesse, sugerido), Analytics (legítimo interesse, sugerido), player (consentimento).
3. **R3 Compartilhamento e operadores:** Vercel, Upstash, Google/YouTube.
4. **R4 Transferência internacional:** os serviços podem processar dados fora do Brasil (ex.: EUA).
5. **R5 Retenção:** hash do IP até 60 s; cache do YouTube até ~25 min; Analytics conforme a Vercel (24 h para a identificação da sessão; relatórios pela janela do plano); logs conforme a Vercel.
6. **R6 Direitos do titular (art. 18):** confirmação, acesso, correção, eliminação, informação sobre compartilhamento, revogação do consentimento; como exercer pelo e-mail; site sem cadastro.
7. **R7 Atualizações** e data de vigência (`siteConfig.legal.updatedAt`).

Não funcionais: manter `LegalSection`/`ExternalLink`, sem caixa alta, sem `font-bold`; `/privacy` continua estática; não remover seções nem os links obrigatórios.

## Critérios de aceite

1. **CA1** A política contém as 7 seções (R1–R7), com textos fiéis ao código.
2. **CA2** Continua citando "YouTube API Services", `https://policies.google.com/privacy` e `https://www.youtube.com/t/terms`.
3. **CA3** `npm run build` mostra `/privacy` como estática (`○`).
4. **CA4** Esta spec lista as frases que dependem de validação jurídica.
5. **CA5** lint, typecheck, testes e build verdes.

## Frases que dependem de validação jurídica (CA4)

Para o revisor da S-01:

1. "Controlador: Radar de Lives, projeto independente de fãs" — um projeto sem personalidade jurídica pode figurar como controlador, ou é preciso pessoa física/jurídica identificada? (pergunta 6 da S-01)
2. Ausência de encarregado (DPO) nomeado, com o e-mail de contato como canal de comunicação — apoiada na dispensa para agentes de pequeno porte (Resolução CD/ANPD nº 2/2022, art. 11) — o projeto se enquadra?
3. Base **legítimo interesse** (art. 7º, IX) para o hash do IP no limite de requisições (segurança e prevenção de abuso).
4. Base **legítimo interesse** para o Vercel Web Analytics; e se os dados da Vercel chegam a ser dado pessoal.
5. Base **consentimento** (art. 7º, I) para o player incorporado, considerando que o clique em "Carregar player" é o ato de consentimento.
6. Miniaturas carregadas de `i.ytimg.com` sem consentimento prévio — base aplicável (texto atual: legítimo interesse, necessário para exibir o conteúdo). (pergunta 3 da S-01)
7. Classificação de Vercel, Upstash como **operadores** e do Google/YouTube como **controlador independente** dos dados que coleta diretamente do navegador.
8. Transferência internacional: mecanismo do art. 33 a citar (cláusulas contratuais dos provedores, art. 33, II, ou outro).
9. Frase sobre o hash do IP: "dado pseudonimizado" vs. "dado anonimizado" (art. 12 e art. 13, §4º).
10. Prazo de resposta aos pedidos do titular (texto atual: "em até 15 dias", inspirado no art. 19, II).
11. Menção ao direito de petição à ANPD (art. 18, §1º).

## Premissas e riscos

- P1: os prazos da Vercel são os publicados na documentação de privacidade do Web Analytics (já citada na política, spec 006).
- P2: o hash do IP é tratado como dado pseudonimizado (pessoal), postura conservadora.
- Risco: texto jurídico sem revisão. Mitigação: seção explícita dizendo que o texto está em revisão; lista acima para a S-01.
