import { LivesError, extractReason, mapUpstreamError } from "./errors";
import type { YtSearchResponse, YtVideosResponse } from "./types";

const API = "https://www.googleapis.com/youtube/v3";

export interface YoutubeClientOptions {
  apiKey: string;
  regionCode: string;
  relevanceLanguage: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  retryDelayMs?: number;
}

/**
 * Cliente mínimo da YouTube Data API v3.
 * A URL contém a chave: NUNCA registrar a URL, a requisição ou o corpo de erro bruto.
 */
export function createYoutubeClient(opts: YoutubeClientOptions) {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 8000;
  const retryDelayMs = opts.retryDelayMs ?? 500;

  async function call<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${API}/${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("key", opts.apiKey);

    // 1 tentativa + 1 retry com backoff, somente para rede/timeout/5xx (D13).
    for (let attempt = 0; ; attempt++) {
      let res: Response;
      try {
        res = await fetchImpl(url, {
          signal: AbortSignal.timeout(timeoutMs),
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
      } catch {
        if (attempt === 0) {
          await sleep(retryDelayMs);
          continue;
        }
        throw new LivesError("upstream_unavailable");
      }
      if (res.ok) return (await res.json()) as T;

      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        /* corpo não-JSON */
      }
      const err = mapUpstreamError(res.status, extractReason(body));
      if (err.code === "upstream_unavailable" && attempt === 0) {
        await sleep(retryDelayMs);
        continue;
      }
      throw err;
    }
  }

  return {
    /** search.list — 1 chamada do bucket de 100 buscas/dia. */
    searchLive(q: string, pageToken?: string) {
      return call<YtSearchResponse>("search", {
        part: "snippet",
        type: "video",
        eventType: "live",
        maxResults: "50",
        q,
        regionCode: opts.regionCode,
        relevanceLanguage: opts.relevanceLanguage,
        safeSearch: "moderate",
        ...(pageToken ? { pageToken } : {}),
      });
    },
    /** videos.list — 1 unidade; até 50 IDs por chamada. */
    videoDetails(ids: string[]) {
      return call<YtVideosResponse>("videos", {
        part: "snippet,liveStreamingDetails,status",
        // maxResults não é suportado junto com `id` (doc oficial de videos.list).
        id: ids.slice(0, 50).join(","),
      });
    },
  };
}

export type YoutubeClient = ReturnType<typeof createYoutubeClient>;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
