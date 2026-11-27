import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { getServerEnv } from "@/lib/config/server-env";
import { createKickClient, createKickClientFromEnv, isKickConfigured } from "@/lib/kick/client";
import type { TelemetryEvent, TelemetryFields } from "@/lib/telemetry";

const SECRET = "SEGREDO_kick_super_secreto_123";
const TOKEN_A = "kick_token_AAA_nunca_logar";
const TOKEN_B = "kick_token_BBB_nunca_logar";
const TOKEN_TTL_S = 5_184_000; // 60 dias, valor real do spike (spec 020, P2)

/** Formato real (fixture anonimizada do spike). */
const fixture = JSON.parse(readFileSync("tests/fixtures/kick/livestreams-v2.json", "utf-8"));
const schema = z.object({
  data: z.array(z.object({ channel: z.object({ slug: z.string() }), viewer_count: z.number() })),
  pagination: z.object({ next_cursor: z.string().optional() }).optional(),
});

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

/** Roteador de fetch falso: decide a resposta pelo endpoint e guarda cada chamada. */
function fakeFetch(handlers: {
  token?: (n: number) => Response | Promise<Response>;
  api?: (n: number, auth: string | null, url: URL) => Response;
}) {
  const calls = { token: 0, api: 0, tokenBodies: [] as string[] };
  let tokenN = 0;
  const impl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);
    if (url.href === "https://id.kick.com/oauth/token") {
      calls.token++;
      calls.tokenBodies.push(String(init?.body));
      return handlers.token
        ? handlers.token(calls.token)
        : json(200, { access_token: tokenN++ === 0 ? TOKEN_A : TOKEN_B, token_type: "Bearer", expires_in: TOKEN_TTL_S });
    }
    calls.api++;
    return handlers.api ? handlers.api(calls.api, headers.get("authorization"), url) : json(200, fixture);
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

function client(f: ReturnType<typeof fakeFetch>, clock = { t: Date.parse("2026-11-27T12:00:00Z") }) {
  const logs: [TelemetryEvent, TelemetryFields | undefined][] = [];
  const c = createKickClient({
    clientId: "client_id_publico",
    clientSecret: SECRET,
    fetchImpl: f.impl,
    retryDelayMs: 0,
    now: () => clock.t,
    log: (e, x) => logs.push([e, x]),
  });
  return { c, logs, clock };
}

const PATH = "v2/livestreams";

describe("cliente da Kick (spec 046)", () => {
  it("CA1: sem credenciais, não configurado e sem cliente (nenhuma chamada de rede)", () => {
    expect(isKickConfigured({ kickClientId: null, kickClientSecret: null })).toBe(false);
    expect(isKickConfigured({ kickClientId: "id", kickClientSecret: null })).toBe(false);
    expect(createKickClientFromEnv({ kickClientId: "id", kickClientSecret: null })).toBeNull();
    expect(isKickConfigured({ kickClientId: "id", kickClientSecret: "s" })).toBe(true);
  });

  it("variáveis: credenciais opcionais e categoria 13155 por padrão (D6)", () => {
    vi.stubEnv("KICK_CLIENT_ID", "");
    vi.stubEnv("KICK_CLIENT_SECRET", "");
    vi.stubEnv("KICK_CATEGORY_ID", "");
    expect(getServerEnv()).toMatchObject({ kickClientId: null, kickClientSecret: null, kickCategoryId: "13155" });
    vi.stubEnv("KICK_CATEGORY_ID", "abc");
    expect(getServerEnv().kickCategoryId).toBe("13155");
    vi.stubEnv("KICK_CATEGORY_ID", "999");
    expect(getServerEnv().kickCategoryId).toBe("999");
    vi.unstubAllEnvs();
  });

  it("pede o token por client credentials, envia Bearer, repete arrays e valida com o schema", async () => {
    let seen: { auth: string | null; url: URL } | null = null;
    const f = fakeFetch({ api: (_n, auth, url) => ((seen = { auth, url }), json(200, fixture)) });
    const { c } = client(f);
    const r = await c.api(PATH, { category_id: "13155", language_code: ["pt", "en", "es"], limit: "1000" }, schema);
    expect(r.data).toHaveLength(3);
    expect(seen!.auth).toBe(`Bearer ${TOKEN_A}`);
    expect(seen!.url.origin + seen!.url.pathname).toBe("https://api.kick.com/public/v2/livestreams");
    expect(seen!.url.searchParams.getAll("language_code")).toEqual(["pt", "en", "es"]);
    const body = new URLSearchParams(f.calls.tokenBodies[0]);
    expect(body.get("grant_type")).toBe("client_credentials");
    expect(body.get("client_id")).toBe("client_id_publico");
  });

  it("CA2: chamadas simultâneas sem token geram um único pedido de token", async () => {
    const f = fakeFetch({});
    const { c } = client(f);
    await Promise.all([c.api(PATH, {}, schema), c.api(PATH, {}, schema), c.api(PATH, {}, schema)]);
    expect(f.calls.token).toBe(1);
    expect(f.calls.api).toBe(3);
  });

  it("CA3: 401 pede token novo e repete uma vez", async () => {
    const f = fakeFetch({
      api: (n, auth) => (n === 1 ? json(401, { message: "Unauthorized" }) : json(200, { data: [{ channel: { slug: auth! }, viewer_count: 1 }] })),
    });
    const { c, logs } = client(f);
    const r = await c.api(PATH, {}, schema);
    expect(f.calls.token).toBe(2);
    expect(r.data[0].channel.slug).toBe(`Bearer ${TOKEN_B}`);
    expect(logs).toContainEqual(["kick_token", { action: "discarded" }]);
  });

  it("CA3: segundo 401 vira upstream_config", async () => {
    const f = fakeFetch({ api: () => json(401, {}) });
    await expect(client(f).c.api(PATH, {}, schema)).rejects.toMatchObject({ code: "upstream_config" });
    expect(f.calls.api).toBe(2);
  });

  it("CA4: renova o token antes de vencer (margem de 5 min)", async () => {
    const f = fakeFetch({});
    const { c, clock } = client(f);
    await c.api(PATH, {}, schema);
    clock.t += TOKEN_TTL_S * 1000 - 5 * 60_000 - 1000; // ainda fora da margem
    await c.api(PATH, {}, schema);
    expect(f.calls.token).toBe(1);
    clock.t += 2000; // entrou na margem de renovação
    await c.api(PATH, {}, schema);
    expect(f.calls.token).toBe(2);
  });

  it("429 vira rate_limited com Retry-After, ou 60 s sem o cabeçalho", async () => {
    const com = fakeFetch({ api: () => json(429, {}, { "Retry-After": "42" }) });
    await expect(client(com).c.api(PATH, {}, schema)).rejects.toMatchObject({ code: "rate_limited", retryAfterSeconds: 42 });
    const sem = fakeFetch({ api: () => json(429, {}) });
    await expect(client(sem).c.api(PATH, {}, schema)).rejects.toMatchObject({ code: "rate_limited", retryAfterSeconds: 60 });
  });

  it("5xx ou rede: tenta de novo uma vez e depois upstream_unavailable", async () => {
    const ok2 = fakeFetch({ api: (n) => (n === 1 ? json(503, {}) : json(200, { data: [] })) });
    await expect(client(ok2).c.api(PATH, {}, schema)).resolves.toEqual({ data: [] });
    const bad = fakeFetch({ api: () => json(500, {}) });
    await expect(client(bad).c.api(PATH, {}, schema)).rejects.toMatchObject({ code: "upstream_unavailable" });
    expect(bad.calls.api).toBe(2);
    const rede = fakeFetch({ api: () => Promise.reject(new TypeError("fetch failed")) as unknown as Response });
    await expect(client(rede).c.api(PATH, {}, schema)).rejects.toMatchObject({ code: "upstream_unavailable" });
  });

  it("400/403 viram upstream_config; resposta fora do schema vira upstream_unavailable", async () => {
    await expect(client(fakeFetch({ api: () => json(400, {}) })).c.api(PATH, {}, schema)).rejects.toMatchObject({ code: "upstream_config" });
    await expect(client(fakeFetch({ api: () => json(403, {}) })).c.api(PATH, {}, schema)).rejects.toMatchObject({ code: "upstream_config" });
    await expect(client(fakeFetch({ api: () => json(200, { dados: 1 }) })).c.api(PATH, {}, schema)).rejects.toMatchObject({ code: "upstream_unavailable" });
  });

  it("token: credencial inválida vira upstream_config sem chamar a API; resposta sem token vira upstream_unavailable", async () => {
    const invalida = fakeFetch({ token: () => json(401, { message: "invalid client" }) });
    await expect(client(invalida).c.api(PATH, {}, schema)).rejects.toMatchObject({ code: "upstream_config" });
    expect(invalida.calls.api).toBe(0);
    const semToken = fakeFetch({ token: () => json(200, { token_type: "Bearer" }) });
    await expect(client(semToken).c.api(PATH, {}, schema)).rejects.toMatchObject({ code: "upstream_unavailable" });
    const fora = fakeFetch({ token: () => json(503, {}) });
    await expect(client(fora).c.api(PATH, {}, schema)).rejects.toMatchObject({ code: "upstream_unavailable" });
    expect(fora.calls.token).toBe(2);
  });

  it("CA5: nenhum log contém secret, token, URL ou parâmetros", async () => {
    const f = fakeFetch({ api: (n) => (n === 1 ? json(401, {}) : n === 2 ? json(503, {}) : json(429, {}, { "Retry-After": "1" })) });
    const { c, logs } = client(f);
    await c.api(PATH, { category_id: "13155" }, schema).catch(() => {});
    const dump = JSON.stringify(logs);
    for (const proibido of [SECRET, TOKEN_A, TOKEN_B, "https://", "client_secret", "category_id", "Bearer"]) expect(dump).not.toContain(proibido);
    expect(logs.length).toBeGreaterThan(0);
  });

  it("CA6: o módulo do cliente importa server-only", () => {
    const src = readFileSync("lib/kick/client.ts", "utf-8");
    expect(src.startsWith('import "server-only";')).toBe(true);
  });
});
