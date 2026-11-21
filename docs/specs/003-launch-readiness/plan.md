# 003 — Plano técnico

## Abordagem

1. **Telemetria:** `lib/telemetry.ts` (`logEvent(evt, fields)`), injetável nos serviços via `log` (assinatura muda de `(msg)` para `(evt, fields?)`). Rotas usam o mesmo logger.
2. **Contraste:** `lib/config/design-tokens.ts` (cores do PRD + `border-strong`), `tests/contrast.test.ts` com fórmula WCAG 2.x. `globals.css` ganha `--color-border-strong`; inputs/selects/botão ghost usam esse token.
3. **Legal:** `siteConfig.legal` (`controller`, `contact`, `updatedAt`); componente `components/legal/legal-page.tsx` (layout + aviso preliminar); páginas `app/privacy/page.tsx`, `app/terms/page.tsx` com `metadata`.
4. **OG:** `app/opengraph-image.tsx` com `ImageResponse`, flexbox, gradientes e bordas; `alt`, `size`, `contentType`.
5. **Links:** rodapé e diálogo do player.
6. **Verificação:** testes, lint, typecheck, build; `next start` sem chave no navegador; `curl` em `/opengraph-image`, `/privacy`, `/terms`.

## Arquivos

Novos: `lib/telemetry.ts`, `lib/config/design-tokens.ts`, `components/legal/legal-page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/opengraph-image.tsx`, `tests/contrast.test.ts`, `tests/telemetry.test.ts`.
Alterados: `lib/youtube/service.ts`, `lib/youtube/video-status.ts`, `app/api/lives/route.ts`, `app/api/lives/[videoId]/route.ts`, `lib/config/site.ts`, `app/globals.css`, `components/lives/live-filters.tsx`, `components/ui/button.tsx`, `components/layout/site-footer.tsx`, `components/lives/live-player-dialog.tsx`, `README.md`.

## Rollback

Arquivos novos isolados; reverter o token `border-strong` restaura o visual anterior.
