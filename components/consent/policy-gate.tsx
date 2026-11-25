"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config/site";
import { readAcceptance, writeAcceptance } from "@/lib/consent/policy-acceptance";
import { thumbnailsSource } from "@/lib/lives/copy";
import type { Platform } from "@/lib/lives/types";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function storedAcceptance(): boolean {
  try {
    return readAcceptance(window.localStorage);
  } catch {
    return false;
  }
}

const linkClass = "text-accent-cyan underline underline-offset-2";

/**
 * Pede a concordância com a Política de Privacidade e os Termos antes de liberar a lista de lives
 * (spec 016). Até o aceite, nada é buscado na API e nenhuma miniatura do YouTube é carregada.
 */
export function PolicyGate({
  children,
  platforms = ["youtube"],
}: {
  children: ReactNode;
  /** Plataformas ativas, calculadas no servidor (spec 034). */
  platforms?: readonly Platform[];
}) {
  // null no servidor e na hidratação: ainda não sabemos o que o navegador guardou.
  const stored = useSyncExternalStore(subscribe, storedAcceptance, () => null);
  const [choice, setChoice] = useState<"accepted" | "refused" | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const movedFocus = useRef(false);

  const accepted = stored === true || choice === "accepted";

  useEffect(() => {
    if (choice === "accepted" && !movedFocus.current) {
      movedFocus.current = true;
      contentRef.current?.focus();
    }
  }, [choice]);

  if (accepted) {
    return (
      <div ref={contentRef} tabIndex={-1} className="outline-none">
        {children}
      </div>
    );
  }

  if (stored === null) {
    return <div aria-busy="true" className="min-h-[70vh]" />;
  }

  function accept() {
    // Se o navegador recusar a gravação, o aceite vale só para esta página aberta.
    writeAcceptance(window.localStorage);
    setChoice("accepted");
  }

  return (
    <section aria-labelledby="policy-title" className="border-b border-border">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <h1 className="font-display text-5xl font-medium leading-[1.04] tracking-[-0.02em] text-balance sm:text-6xl">
          Lives de GTA&nbsp;6 no ar agora
        </h1>
        <div role="region" aria-labelledby="policy-title" className="mt-10 rounded-xl bg-surface p-6 ring-1 ring-border sm:p-8">
          <h2 id="policy-title" className="text-xl font-medium text-text-primary">
            Antes de ver as lives
          </h2>
          <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-text-secondary">
            <p>
              O {siteConfig.name} usa os YouTube API Services{platforms.includes("twitch") ? " e a API da Twitch" : ""}.
              Para continuar, leia e concorde com a{" "}
              <Link href="/privacy" className={linkClass}>
                Política de Privacidade
              </Link>{" "}
              e os{" "}
              <Link href="/terms" className={linkClass}>
                Termos de Uso
              </Link>
              , que incluem os{" "}
              <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className={linkClass}>
                Termos de Serviço do YouTube
              </a>
              .
            </p>
            <p>
              Depois disso, seu navegador carrega as miniaturas direto {thumbnailsSource(platforms)}. O player só abre
              quando você pedir. A escolha fica guardada só neste navegador.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="primary" onClick={accept}>
              Li e concordo. Continuar
            </Button>
            <Button onClick={() => setChoice("refused")}>Não concordo</Button>
          </div>
          <p role="status" className="mt-4 text-sm text-text-secondary">
            {choice === "refused"
              ? "Sem a concordância, a lista de lives não é carregada. As páginas de política e termos continuam disponíveis, e você pode mudar de ideia a qualquer momento."
              : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
