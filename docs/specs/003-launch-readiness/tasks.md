# 003 — Tarefas

Legenda: [x] concluído e verificado · [ ] pendente · [!] bloqueado
Última atualização: 2026-11-22

- [x] T1 Telemetria (`lib/telemetry.ts`) nos serviços e rotas; teste confirma eventos e ausência da chave — CA6
- [x] T2 `design-tokens.ts` + `tests/contrast.test.ts` (texto ≥ 4,5:1, controles ≥ 3:1, tokens = CSS); `border-strong` em inputs/selects/botão secundário — CA5
- [x] T3 `siteConfig.legal` + `LegalPage` + `/privacy` + `/terms`; aviso "Versão preliminar" com dados nulos — CA1, CA2, CA3
- [x] T4 Links "Privacidade"/"Termos" no rodapé; política linkada no consentimento do player; header funciona fora da home (`/#lives`) — RF4
- [x] T5 `opengraph-image.tsx`: PNG 1200×630, 65 KB, `og:image` na home — CA4
- [x] T6 lint ok · typecheck ok · testes 85/85 · build ok (todas as páginas novas estáticas) · chave fictícia 0× em `.next` — CA8
- [x] T7 `next start` sem chave: `/`, `/privacy`, `/terms` 200; `/opengraph-image` `image/png`; `/api/lives` 503 com mensagem neutra; home sem cards simulados e com "Busca indisponível" — CA1, CA4, CA7
- [x] T8 Cache compartilhado — feito na spec 005 (Upstash Redis). (Fechado em 2026-11-22, spec 011.)
- [x] T9 Teste com chave real — feito na spec 004 (§2, 50 itens reais). (Fechado em 2026-11-22, spec 011.)

## Achados corrigidos na verificação
- "0 lives encontradas" sem nenhuma busca concluída → "Busca indisponível" (D8).
- Instruções de `.env.local` visíveis ao público em produção → mensagem neutra (D7).
- Subtítulo da imagem OG sobre o horizonte → horizonte rebaixado e véu (D10).

## Não verificado
- Revisão jurídica dos textos (fora do escopo técnico).
- Como as redes sociais exibem a imagem OG (exige URL pública).
- Retenção/consulta dos logs: depende do provedor de hospedagem.

## Pendências do usuário antes do lançamento (todas resolvidas em 2026-11-22, spec 011)
1. Preencher `siteConfig.legal.controller` e `contact` e revisar os textos → feito na S-01 (spec 016).
2. Definir `NEXT_PUBLIC_SITE_URL` (domínio final) e o nome final → `radardelives.darioreis.dev`, variável em Production e Preview.
3. Configurar `YOUTUBE_API_KEY` e fazer o teste real (T9) → specs 004 e 005.
4. Decidir o cache compartilhado ou fazer deploy em instância única → Upstash (spec 005).

## Próxima fatia sugerida — 004-real-key-validation
Com a chave configurada: medir quota por atualização, conferir cobertura e qualidade dos termos de busca, calibrar a heurística de idioma com dados reais e ajustar `LIVE_SEARCH_TERMS` se necessário.
