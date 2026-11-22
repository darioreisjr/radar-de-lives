# 008 — Plano

## Abordagem

Só texto, em `app/privacy/page.tsx`, com os componentes existentes (`LegalSection`, `ExternalLink`). Nenhuma lógica nova, nenhum componente novo, nenhuma API de requisição (a página segue estática).

Ordem final das seções (as existentes ficam intactas e na mesma ordem; as novas entram depois de "Conteúdo carregado do Google"):

1. Resumo (existente)
2. Uso dos YouTube API Services (existente)
3. Dados tratados pelo site (existente)
4. Estatísticas de visitas (existente)
5. Conteúdo carregado do Google (existente)
6. **Controlador e contato** (R1) — `siteConfig.legal`; sem encarregado nomeado, e-mail como canal
7. **Finalidades e bases legais** (R2) — lista por tratamento, com bases "sugeridas"
8. **Compartilhamento e operadores** (R3) — Vercel, Upstash, Google/YouTube
9. **Transferência internacional** (R4)
10. **Por quanto tempo guardamos** (R5)
11. **Seus direitos** (R6) — art. 18, como exercer, sem cadastro, ANPD
12. Seus controles (existente)
13. **Atualizações desta política** (R7) — vigência = `updatedAt`, aviso de revisão jurídica

## Arquivos

- `app/privacy/page.tsx`
- `lib/config/site.ts` (`legal.updatedAt` → `2026-11-22`)
- `docs/specs/008-lgpd-privacy/*`

## Verificação

```bash
npm run lint && npm run typecheck && npm test && npm run build
npm run dev   # /privacy em 375 px e desktop
```

Conferir no build `○ /privacy`; no HTML, os links obrigatórios e "YouTube API Services".

## Rollback

Reverter o commit; não há dados nem migrações.
