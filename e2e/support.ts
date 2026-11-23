import { expect, test as base, type Route } from "@playwright/test";
import { POLICY_STORAGE_KEY, serializeAcceptance } from "../lib/consent/policy-acceptance";
import type { LiveItem, LiveLanguage, LivesPayload, VideoLiveState, VideoStatusPayload } from "../lib/youtube/types";

/* ---------- Dados simulados ---------- */

const LANGS: LiveLanguage[] = ["pt", "pt", "pt", "en", "en", "es"];

/** IDs com 11 caracteres, como os do YouTube. */
export const videoId = (n: number) => `e2eVideo${String(n).padStart(3, "0")}`;

export function liveItem(n: number, over: Partial<LiveItem> = {}): LiveItem {
  const id = videoId(n);
  return {
    videoId: id,
    title: `Live simulada ${n} de teste`,
    description: "Item simulado para testes de interface.",
    channelId: `canal-${n}`,
    channelTitle: `Canal simulado ${n}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    publishedAt: new Date(Date.now() - (n + 10) * 60_000).toISOString(),
    liveStartedAt: new Date(Date.now() - (n + 5) * 60_000).toISOString(),
    concurrentViewers: n % 3 === 0 ? null : 1000 * n,
    language: LANGS[(n - 1) % LANGS.length],
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
    embedUrl: `https://www.youtube.com/embed/${id}`,
    isLive: true,
    embedAllowed: true,
    rank: n - 1,
    ...over,
  };
}

/** 6 lives: 3 em português, 2 em inglês, 1 em espanhol. */
export const sixLives = () => Array.from({ length: 6 }, (_, i) => liveItem(i + 1));

export function livesPayload(items: LiveItem[], over: Partial<LivesPayload> = {}): LivesPayload {
  return {
    items,
    updatedAt: new Date().toISOString(),
    cached: false,
    stale: false,
    nextPageToken: null,
    source: "youtube",
    ...over,
  };
}

export function statusPayload(id: string, state: VideoLiveState, over: Partial<VideoStatusPayload> = {}): VideoStatusPayload {
  return {
    videoId: id,
    state,
    embedAllowed: true,
    concurrentViewers: state === "live" ? 4321 : null,
    checkedAt: new Date().toISOString(),
    cached: false,
    ...over,
  };
}

/* ---------- Respostas simuladas da API ---------- */

export type Reply = { status?: number; body?: unknown; abort?: boolean };

export const ok = (body: unknown): Reply => ({ status: 200, body });
export const apiError = (code: string, status: number, message: string): Reply => ({
  status,
  body: { error: { code, message } },
});
export const networkFailure: Reply = { abort: true };

/** Controla as respostas de /api/lives e /api/lives/<id>. Qualquer outra rota de /api/ é bloqueada e registrada. */
export class ApiMock {
  private livesReplies: Reply[] = [ok(livesPayload(sixLives()))];
  status: (id: string) => Reply = (id) => ok(statusPayload(id, "live"));
  readonly livesCalls: string[] = [];
  readonly statusCalls: string[] = [];
  readonly unmocked: string[] = [];

  /** Cada chamada consome a próxima resposta; a última se repete. */
  setLives(...replies: Reply[]) {
    this.livesReplies = replies;
  }

  async handle(route: Route) {
    const url = new URL(route.request().url());
    let reply: Reply;
    if (url.pathname === "/api/lives") {
      this.livesCalls.push(url.search);
      reply = this.livesReplies.length > 1 ? this.livesReplies.shift()! : this.livesReplies[0];
    } else {
      const m = url.pathname.match(/^\/api\/lives\/([^/]+)$/);
      if (!m) {
        this.unmocked.push(url.pathname);
        return route.abort();
      }
      const id = decodeURIComponent(m[1]);
      this.statusCalls.push(id);
      reply = this.status(id);
    }
    if (reply.abort) return route.abort("internetdisconnected");
    return route.fulfill({
      status: reply.status ?? 200,
      contentType: "application/json",
      headers: { "Cache-Control": "no-store" },
      body: JSON.stringify(reply.body),
    });
  }
}

/* ---------- Fixture ---------- */

// PNG 1×1 transparente.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

export const test = base.extend<{ acceptPolicy: boolean; api: ApiMock }>({
  /** true: a política já foi aceita nesta visita simulada (pula a tela de aceite). */
  acceptPolicy: [true, { option: true }],
  api: [
    async ({ page, acceptPolicy, baseURL }, use) => {
      const api = new ApiMock();
      const google: string[] = [];
      page.on("request", (req) => {
        const host = new URL(req.url()).hostname;
        if (host === "googleapis.com" || host.endsWith(".googleapis.com")) google.push(req.url());
      });

      const origin = new URL(baseURL!).origin;
      await page.route((u) => u.origin === origin && u.pathname.startsWith("/api/"), (r) => api.handle(r));
      // Nada sai para o Google: miniaturas e player respondidos localmente.
      await page.route((u) => u.hostname === "i.ytimg.com", (r) => r.fulfill({ contentType: "image/png", body: PNG }));
      await page.route(
        (u) => u.hostname === "www.youtube.com",
        (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><title>Player simulado</title><p>player</p>" }),
      );

      if (acceptPolicy) {
        await page.addInitScript(
          ([key, value]) => {
            try {
              window.localStorage.setItem(key, value);
            } catch {}
          },
          [POLICY_STORAGE_KEY, serializeAcceptance()] as const,
        );
      }

      await use(api);

      expect(google, "nenhuma requisição real a googleapis.com").toEqual([]);
      expect(api.unmocked, "toda rota de /api/ precisa estar simulada").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Resumo acima da grade ("6 lives encontradas", "Busca indisponível"...). */
export const summary = (page: import("@playwright/test").Page) => page.locator('p[aria-live="polite"]').first();
