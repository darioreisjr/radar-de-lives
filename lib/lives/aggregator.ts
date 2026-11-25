import { dedupeById } from "@/lib/lives/identity";
import type { LiveItem, LivesErrorCode, SourceStatus } from "@/lib/lives/types";
import { logEvent, type Logger } from "@/lib/telemetry";
import { LivesError } from "@/lib/youtube/errors";
import type { LivesProvider, ProviderResult } from "./providers/types";

export interface AggregatedResult {
  items: LiveItem[];
  updatedAt: string;
  cached: boolean;
  stale: boolean;
  nextPageToken: string | null;
  sources: SourceStatus[];
}

function withTimeout<T>(p: Promise<T>, ms: number | undefined): Promise<T> {
  if (ms === undefined) return p;
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new LivesError("upstream_unavailable")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

/**
 * Intercala por posição na ordem dos provedores (PRD D5, spec 022 D3).
 * Com um único provedor contribuindo, devolve os itens intactos, inclusive o rank original.
 */
export function interleave(lists: readonly LiveItem[][]): LiveItem[] {
  const filled = lists.filter((l) => l.length > 0);
  if (filled.length <= 1) return filled[0] ? [...filled[0]] : [];
  const sorted = filled.map((l) => [...l].sort((a, b) => a.rank - b.rank));
  const out: LiveItem[] = [];
  const max = Math.max(...sorted.map((l) => l.length));
  for (let i = 0; i < max; i++) for (const l of sorted) if (i < l.length) out.push(l[i]);
  return out.map((it, rank) => ({ ...it, rank }));
}

export function createLivesAggregator(deps: { providers: readonly LivesProvider[]; log?: Logger }) {
  const log = deps.log ?? logEvent;

  async function getLives(pageToken?: string): Promise<AggregatedResult> {
    // pageToken só existe no YouTube (D4).
    const providers = pageToken ? deps.providers.filter((p) => p.platform === "youtube") : deps.providers;
    if (providers.length === 0) throw new LivesError("upstream_unavailable");

    const settled = await Promise.allSettled(
      providers.map((p) => withTimeout(p.getLives({ pageToken }), p.timeoutMs)),
    );

    const ok: { provider: LivesProvider; result: ProviderResult }[] = [];
    const failed: { provider: LivesProvider; code: LivesErrorCode; error: LivesError }[] = [];
    settled.forEach((s, i) => {
      const provider = providers[i];
      if (s.status === "fulfilled") {
        ok.push({ provider, result: s.value });
      } else {
        const error = s.reason instanceof LivesError ? s.reason : new LivesError("upstream_unavailable");
        failed.push({ provider, code: error.code, error });
      }
    });

    if (ok.length === 0) {
      // Erro total: mesmo erro de hoje (D5).
      const main = failed.find((f) => f.provider.platform === "youtube") ?? failed[0];
      throw main.error;
    }
    // Só registra falha parcial; a falha total já é registrada pela rota/serviço como hoje.
    for (const f of failed) log("provider_failed", { platform: f.provider.platform, code: f.code });

    const items = dedupeById(interleave(ok.map((o) => o.result.items)));
    const oldest = ok.map((o) => o.result.updatedAt).sort()[0];
    const youtube = ok.find((o) => o.provider.platform === "youtube");

    const sources: SourceStatus[] = providers.map((p) => {
      const hit = ok.find((o) => o.provider === p);
      if (hit) {
        return { platform: p.platform, ok: true, cached: hit.result.cached, stale: hit.result.stale, updatedAt: hit.result.updatedAt };
      }
      const miss = failed.find((f) => f.provider === p)!;
      return { platform: p.platform, ok: false, cached: false, stale: false, updatedAt: null, errorCode: miss.code };
    });

    return {
      items,
      updatedAt: oldest,
      cached: ok.every((o) => o.result.cached),
      stale: ok.some((o) => o.result.stale),
      nextPageToken: youtube?.result.nextPageToken ?? null,
      sources,
    };
  }

  return { getLives };
}

export type LivesAggregator = ReturnType<typeof createLivesAggregator>;
