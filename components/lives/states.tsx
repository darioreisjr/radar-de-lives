import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

function Panel({
  tone,
  title,
  children,
  action,
  role,
}: {
  tone: "neutral" | "error" | "quota";
  title: string;
  children: ReactNode;
  action?: ReactNode;
  role?: "alert" | "status";
}) {
  const accent = { neutral: "bg-border-strong", error: "bg-live-red", quota: "bg-border-strong" }[tone];
  return (
    <div role={role} className="relative overflow-hidden rounded-xl bg-surface p-6 ring-1 ring-border sm:p-8">
      <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} aria-hidden="true" />
      <h3 className="text-lg font-medium">{title}</h3>
      <div className="mt-2 max-w-prose text-sm leading-relaxed text-text-secondary">{children}</div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function EmptyState({
  filtered,
  onClear,
  platformFilter = false,
}: {
  filtered: boolean;
  onClear: () => void;
  /** O filtro de plataforma está visível (spec 026). */
  platformFilter?: boolean;
}) {
  return filtered ? (
    <Panel tone="neutral" title="Nenhum resultado com esses filtros" role="status" action={<Button onClick={onClear}>Limpar filtros</Button>}>
      Os filtros atuais escondem todas as lives encontradas.{" "}
      {platformFilter ? "Ajuste o texto, o idioma ou a plataforma." : "Ajuste o texto ou o idioma."}
    </Panel>
  ) : (
    <Panel tone="neutral" title="Nenhuma live encontrada agora" role="status">
      A busca não retornou transmissões ativas neste momento. Isso não significa que não exista nenhuma: a busca depende
      de títulos, idioma e região. Tente atualizar mais tarde.
    </Panel>
  );
}

export function ErrorState({ message, onRetry, retryDisabled }: { message: string; onRetry: () => void; retryDisabled?: boolean }) {
  return (
    <Panel
      tone="error"
      title="Não foi possível buscar as lives"
      role="alert"
      action={
        <Button variant="primary" onClick={onRetry} disabled={retryDisabled}>
          Tentar novamente
        </Button>
      }
    >
      {message}
    </Panel>
  );
}

export function QuotaState({ message }: { message: string }) {
  return (
    <Panel tone="quota" title="Limite de consultas atingido" role="alert">
      <p>{message}</p>
      <p className="mt-2">Para proteger a quota, o Radar não fará novas buscas até lá. Lives já encontradas continuam no YouTube.</p>
    </Panel>
  );
}

export function SetupState({ message, production }: { message: string; production: boolean }) {
  return (
    <Panel tone="neutral" title={production ? "Busca indisponível no momento" : "Busca no YouTube não configurada"} role="status">
      {message}
    </Panel>
  );
}
