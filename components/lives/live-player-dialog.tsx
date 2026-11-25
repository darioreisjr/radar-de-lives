"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { Button, buttonBase, buttonStyles } from "@/components/ui/button";
import { embedSrc, playerBadge, resolvePlayerView, type PlayerBadge, type PlayerView, type StatusCheck } from "@/lib/lives/player-state";
import { platformMeta, type PlatformMeta } from "@/lib/lives/platforms";
import type { LiveItem, LivesErrorPayload, LiveStatusPayload } from "@/lib/lives/types";
import { formatViewers } from "@/lib/utils/format";

/** Mensagens por estado. Os nomes da plataforma vêm do mapa (spec 025 D1); no YouTube, iguais às de antes. */
function messages(p: PlatformMeta): Partial<Record<PlayerView["kind"], { title: string; body: string }>> {
  return {
    demo: { title: "Item simulado", body: "Este card é um exemplo de desenvolvimento e não tem vídeo para reproduzir." },
    ended: { title: "Esta live terminou", body: `A transmissão foi encerrada depois da última busca. ${p.subjectLabel} pode ter a gravação.` },
    upcoming: { title: "Ainda não começou", body: `${p.subjectLabel} informa esta transmissão como agendada.` },
    unavailable: { title: "Vídeo indisponível", body: "O vídeo pode ter sido removido, ficado privado ou não estar disponível na sua região." },
    embed_blocked: { title: "Player indisponível aqui", body: `O canal não permite incorporar este vídeo em outros sites. Assista direto ${p.inLabel}.` },
    link_only: { title: `Assista ${p.inLabel}`, body: `O player ${p.ofLabel} ainda não pode ser exibido aqui. Abra a live direto ${p.inLabel}.` },
  };
}

/** Selo do cabeçalho conforme o estado revalidado (spec 018). "live" usa o LiveBadge. */
const BADGE_LABEL: Record<Exclude<PlayerBadge, "live">, string> = {
  demo: "Simulado",
  ended: "Encerrada",
  upcoming: "Agendada",
  unavailable: "Indisponível",
};

function PlatformLink({ href, primary, platform }: { href: string; primary?: boolean; platform: PlatformMeta }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${buttonBase} ${primary ? buttonStyles.primary : buttonStyles.ghost}`}
    >
      Abrir {platform.inLabel}
      <span className="sr-only">(abre em nova aba)</span>
    </a>
  );
}

export function LivePlayerDialog({
  item,
  demo,
  consented,
  onConsent,
  onStatus,
  onClose,
}: {
  item: LiveItem;
  demo: boolean;
  consented: boolean;
  onConsent: () => void;
  onStatus: (status: LiveStatusPayload) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [check, setCheck] = useState<StatusCheck>({ status: "pending" });
  const reportStatus = useEffectEvent(onStatus);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  // Revalida a live ao abrir (spec 002 D5), pela rota de status da plataforma (spec 024/025). Falha não bloqueia (D6).
  useEffect(() => {
    if (demo) return;
    const ac = new AbortController();
    fetch(`/api/status/${item.platform}/${encodeURIComponent(item.sourceId)}`, { signal: ac.signal, cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json()) as LiveStatusPayload | LivesErrorPayload;
        if (!res.ok || "error" in body) {
          setCheck({ status: "error", code: "error" in body ? body.error.code : "upstream_unavailable" });
          return;
        }
        setCheck({ status: "ok", data: body });
        reportStatus(body);
      })
      .catch(() => {
        if (!ac.signal.aborted) setCheck({ status: "error", code: "network" });
      });
    return () => ac.abort();
  }, [demo, item.platform, item.sourceId]);

  const platform = platformMeta(item.platform);
  const view = resolvePlayerView({ demo, platformEmbed: platform.embed, listEmbedAllowed: item.embedAllowed, check, consented });
  const message = messages(platform)[view.kind];
  // O diálogo só renderiza no cliente, depois do clique (spec 025 D4).
  const src = view.kind === "player" ? embedSrc(item, { hostname: window.location.hostname }) : null;
  const titleId = "player-dialog-title";
  const badge = playerBadge({ demo, listIsLive: item.isLive, check });
  const live = badge === "live";
  const viewers =
    check.status === "ok" && check.data.state === "live"
      ? formatViewers(check.data.concurrentViewers ?? item.concurrentViewers)
      : formatViewers(item.concurrentViewers);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[min(960px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-surface p-0 text-text-primary ring-1 ring-border backdrop:bg-background/85 backdrop:backdrop-blur-sm open:animate-dialog-in"
    >
      <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {badge === "live" ? <LiveBadge /> : <Badge tone={badge === "demo" ? "demo" : "neutral"}>{BADGE_LABEL[badge]}</Badge>}
            {!demo && live && <span className="font-mono text-xs text-accent-cyan">{viewers.full}</span>}
          </div>
          <h2 id={titleId} className="mt-2 line-clamp-2 text-lg font-medium leading-snug">
            {item.title}
          </h2>
          <p className="mt-1 truncate text-sm text-text-secondary">{item.channelTitle}</p>
        </div>
        <Button onClick={() => ref.current?.close()} aria-label="Fechar player" className="shrink-0 px-3">
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </Button>
      </div>

      {/* Área do player: ≥ 200 px de altura e nada sobreposto ao iframe (RMF). */}
      <div className="relative aspect-video min-h-[200px] w-full bg-background">
        {src ? (
          <iframe
            src={src}
            title={`Player ${platform.ofLabel}: ${item.title}`}
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center overflow-y-auto p-5 sm:p-8" aria-live="polite">
            <div className="max-w-md text-center">
              {view.kind === "checking" && <p className="text-sm text-text-secondary">Conferindo se a live continua…</p>}
              {message && (
                <>
                  <p className="text-lg font-medium">{message.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{message.body}</p>
                </>
              )}
              {view.kind === "consent" && platform.consent && (
                <>
                  {view.unverified && (
                    <p className="mb-3 text-sm text-text-secondary">
                      Não conseguimos confirmar se a live continua. Ela pode ter terminado.
                    </p>
                  )}
                  <p className="text-sm leading-relaxed text-text-secondary">
                    O player é carregado {platform.consent.from}, que pode coletar dados de uso conforme a{" "}
                    <a href={platform.consent.privacyUrl} target="_blank" rel="noopener noreferrer" className="text-accent-cyan underline underline-offset-2">
                      {platform.consent.privacyName}
                    </a>
                    . Veja também a{" "}
                    <a href="/privacy" target="_blank" className="text-accent-cyan underline underline-offset-2">
                      nossa política de privacidade
                      <span className="sr-only"> (abre em nova aba)</span>
                    </a>
                    .
                  </p>
                  <Button variant="primary" onClick={onConsent} className="mt-4">
                    Carregar player
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {!demo && (
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-xs leading-relaxed text-text-secondary">
            {view.kind === "player"
              ? view.unverified
                ? `Não confirmamos o estado atual. Se o player não carregar, abra ${platform.inLabel}.`
                : `Se o player não carregar ou mostrar erro, abra ${platform.inLabel}.`
              : `Você também pode assistir direto ${platform.inLabel}.`}
          </p>
          <PlatformLink href={item.watchUrl} platform={platform} primary={view.kind !== "consent" && view.kind !== "player"} />
        </div>
      )}
    </dialog>
  );
}
