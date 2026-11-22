import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteConfig } from "@/lib/config/site";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" });

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const { controller, contact, updatedAt } = siteConfig.legal;
  const preliminary = !controller || !contact;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <Link href="/" className="text-sm text-accent-cyan underline underline-offset-2">
            ← Voltar para as lives
          </Link>
          <h1 className="mt-6 font-display text-4xl font-medium tracking-[-0.02em] sm:text-5xl">{title}</h1>
          <p className="mt-3 font-mono text-xs text-text-secondary">
            Atualizado em <time dateTime={updatedAt}>{dateFmt.format(new Date(`${updatedAt}T00:00:00Z`))}</time>
          </p>

          {preliminary && (
            <div role="note" className="mt-6 rounded-xl bg-surface p-4 text-sm ring-1 ring-border">
              <p className="font-medium text-text-primary">Versão preliminar</p>
              <p className="mt-1 text-text-secondary">
                O responsável pelo site e o contato ainda não foram definidos. Este texto descreve o funcionamento atual do
                site e precisa de revisão antes da publicação.
              </p>
            </div>
          )}

          <div className="legal-prose mt-8 space-y-8 text-[15px] leading-relaxed text-text-secondary">{children}</div>

          <section className="mt-10 border-t border-border pt-6 text-sm text-text-secondary">
            <h2 className="text-lg font-medium text-text-primary">Responsável e contato</h2>
            <p className="mt-2">
              Responsável (controlador dos dados): {controller ?? "a definir"}. Contato: {contact ?? "a definir"}.
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-medium text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent-cyan underline underline-offset-2">
      {children}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}
