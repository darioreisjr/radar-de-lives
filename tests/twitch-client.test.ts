import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { TelemetryEvent, TelemetryFields } from "@/lib/telemetry";
import { createTwitchClient, createTwitchClientFromEnv, isTwitchConfigured } from "@/lib/twitch/client";

const SECRET = "SEGREDO_super_secreto_123";
const TOKEN_A = "token_AAA_nunca_logar";
const TOKEN_B = "token_BBB_nunca_logar";
const schema = z.object({ data: z.array(z.object({ id: z.string() })) });

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

/** Roteador de fetch falso: decide a resposta pelo endpoint e guarda cada chamada. */
function fakeFetch(handlers: {
  token?: (n: number) => Response | Promise<Response>;
  validate?: (n: number) => Response;
  helix?: (n: number, auth: string | null, url: URL) => Response;
}) {
  const calls = { token: 0, validate: 0, helix: 0, urls: [] as string[] };
  let tokenN = 0;
  const impl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    calls.urls.push(url.toString());
    const headers = new Headers(init?.headers);
    if (url.href.startsWith("https://id.twitch.tv/oauth2/token")) {
      calls.token++;
      return handlers.token ? handlers.token(calls.token) : json(200, { access_token: tokenN++ === 0 ? TOKEN_A : TOKEN_B, expires_in: 3600, token_type: "bearer" });
    }
    if (url.href.startsWith("https://id.twitch.tv/oauth2/validate")) {
      calls.validate++;
      return handlers.validate ? handlers.validate(calls.validate) : json(200, { client_id: "x", expires_in: 1000 });
    }
    calls.helix++;
    return handlers.helix ? handlers.helix(calls.helix, headers.get("authorization"), url) : json(200, { data: [{ id: "1" }] });
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

function client(f: ReturnType<typeof fakeFetch>, clock = { t: Date.parse("2026-11-25T12:00:00Z") }) {
  const logs: [TelemetryEvent, TelemetryFields | undefined][] = [];
  const c = createTwitchClient({
    clientId: "client_id_publico",
    clientSecret: SECRET,
    fetchImpl: f.impl,
    retryDelayMs: 0,
    now: () => clock.t,
    log: (e, x) => logs.push([e, x]),
  });
  return { c, logs, clock };
}

describe("cliente da Twitch (spec 027)", () => {
  it("CA1: sem credenciais, não configurado e sem cliente (nenhuma chamada de rede)", () => {
    expect(isTwitchConfigured({ twitchClientId: null, twitchClientSecret: null })).toBe(false);
    expect(isTwitchConfigured({ twitchClientId: "id", twitchClientSecret: null })).toBe(false);
    expect(createTwitchClientFromEnv({ twitchClientId: "id", twitchClientSecret: null })).toBeNull();
    expect(isTwitchConfigured({ twitchClientId: "id", twitchClientSecret: "s" })).toBe(true);
  });

  it("envia Client-Id e Bearer, repete parâmetros em array e valida com o schema", async () => {
    let seen: { auth: string | null; url: URL } | null = null;
    const f = fakeFetch({ helix: (_n, auth, url) => ((seen = { auth, url }), json(200, { data: [{ id: "9" }] })) });
    const { c } = client(f);
    const r = await c.helix("streams", { game_id: "1867279146", language: ["pt", "en", "es"], first: "100" }, schema);
    expect(r).toEqual({ data: [{ id: "9" }] });
    expect(seen!.auth).toBe(`Bearer ${TOKEN_A}`);
    expect(seen!.url.searchParams.getAll("language")).toEqual(["pt", "en", "es"]);
    expect(seen!.url.pathname).toBe("/helix/streams");
  });

  it("CA2: chamadas simultâneas sem token geram um único pedido de token", async () => {
    const f = fakeFetch({});
    const { c } = client(f);
    await Promise.all([c.helix("streams", {}, schema), c.helix("streams", {}, schema), c.helix("games", {}, schema)]);
    expect(f.calls.token).toBe(1);
    expect(f.calls.helix).toBe(3);
  });

  it("CA3: 401 pede token novo e repete uma vez", async () => {
    const f = fakeFetch({ helix: (n, auth) => (n === 1 ? json(401, { message: "Invalid OAuth token" }) : json(200, { data: [{ id: auth! }] })) });
    const { c } = client(f);
    const r = await c.helix("streams", {}, schema);
    expect(f.calls.token).toBe(2);
    expect(r.data[0].id).toBe(`Bearer ${TOKEN_B}`);
  });

  it("CA3: segundo 401 vira upstream_config", async () => {
    const f = fakeFetch({ helix: () => json(401, {}) });
    const { c } = client(f);
    await expect(c.helix("streams", {}, schema)).rejects.toMatchObject({ code: "upstream_config" });
    expect(f.calls.helix).toBe(2);
  });

  it("CA4: renova o token antes de vencer (margem de 5 min)", async () => {
    const f = fakeFetch({});
    const { c, clock } = client(f);
    await c.helix("streams", {}, schema);
    clock.t += 3600_000 - 5 * 60_000 - 1000; // ainda dentro da margem
    await c.helix("streams", {}, schema);
    expect(f.calls.token).toBe(1);
    clock.t += 2000; // entrou na margem de renovação
    await c.helix("streams", {}, schema);
    expect(f.calls.token).toBe(2);
  });

  it("CA4: valida o token a cada hora; 401 na validação troca o token", async () => {
    // Token de 24 h para isolar a validação horária da renovação por vencimento.
    const f = fakeFetch({
      validate: () => json(401, {}),
      token: (n) => json(200, { access_token: n === 1 ? TOKEN_A : TOKEN_B, expires_in: 86_400, token_type: "bearer" }),
    });
    const clock = { t: Date.parse("2026-11-25T12:00:00Z") };
    const { c } = client(f, clock);
    await c.helix("streams", {}, schema);
    clock.t += 30 * 60_000;
    await c.helix("streams", {}, schema);
    expect(f.calls.validate).toBe(0);
    clock.t += 31 * 60_000; // passou de 1 h desde a emissão (ainda antes da margem de renovação)
    await c.helix("streams", {}, schema);
    expect(f.calls.validate).toBe(1);
    expect(f.calls.token).toBe(2);
  });

  it("validação que falha por rede ou 5xx não bloqueia o token atual", async () => {
    const f = fakeFetch({ validate: () => json(503, {}), token: () => json(200, { access_token: TOKEN_A, expires_in: 86_400, token_type: "bearer" }) });
    const { c, clock } = client(f);
    await c.helix("streams", {}, schema);
    clock.t += 61 * 60_000;
    await c.helix("streams", {}, schema);
    expect(f.calls.validate).toBe(1);
    expect(f.calls.token).toBe(1);
  });

  it("429 vira rate_limited com o tempo até o Ratelimit-Reset", async () => {
    const t0 = Date.parse("2026-11-25T12:00:00Z");
    const f = fakeFetch({ helix: () => json(429, {}, { "Ratelimit-Reset": String(t0 / 1000 + 42), "Ratelimit-Remaining": "0" }) });
    const { c } = client(f);
    await expect(c.helix("streams", {}, schema)).rejects.toMatchObject({ code: "rate_limited", retryAfterSeconds: 42 });
    expect(c.rateLimit()).toEqual({ remaining: 0, resetAt: t0 + 42_000 });
  });

  it("5xx ou rede: tenta de novo uma vez e depois upstream_unavailable", async () => {
    const ok2 = fakeFetch({ helix: (n) => (n === 1 ? json(503, {}) : json(200, { data: [] })) });
    await expect(client(ok2).c.helix("streams", {}, schema)).resolves.toEqual({ data: [] });
    const bad = fakeFetch({ helix: () => json(500, {}) });
    await expect(client(bad).c.helix("streams", {}, schema)).rejects.toMatchObject({ code: "upstream_unavailable" });
    expect(bad.calls.helix).toBe(2);
  });

  it("400/403 viram upstream_config; resposta fora do schema vira upstream_unavailable", async () => {
    await expect(client(fakeFetch({ helix: () => json(400, {}) })).c.helix("streams", {}, schema)).rejects.toMatchObject({ code: "upstream_config" });
    await expect(client(fakeFetch({ helix: () => json(403, {}) })).c.helix("streams", {}, schema)).rejects.toMatchObject({ code: "upstream_config" });
    await expect(client(fakeFetch({ helix: () => json(200, { dados: 1 }) })).c.helix("streams", {}, schema)).rejects.toMatchObject({ code: "upstream_unavailable" });
  });

  it("credencial inválida no endpoint de token vira upstream_config, sem tentar a Helix", async () => {
    const f = fakeFetch({ token: () => json(400, { message: "invalid client secret" }) });
    await expect(client(f).c.helix("streams", {}, schema)).rejects.toMatchObject({ code: "upstream_config" });
    expect(f.calls.helix).toBe(0);
  });

  it("CA5: nenhum log contém secret, token ou URL", async () => {
    const f = fakeFetch({ helix: (n) => (n === 1 ? json(401, {}) : n === 2 ? json(503, {}) : json(429, {}, { "Ratelimit-Reset": "1" })) });
    const { c, logs } = client(f);
    await c.helix("streams", { game_id: "1" }, schema).catch(() => {});
    const dump = JSON.stringify(logs);
    for (const proibido of [SECRET, TOKEN_A, TOKEN_B, "https://", "client_secret", "game_id"]) expect(dump).not.toContain(proibido);
    expect(logs.length).toBeGreaterThan(0);
  });

  it("CA6: o módulo do cliente importa server-only", () => {
    const src = readFileSync("lib/twitch/client.ts", "utf-8");
    expect(src.startsWith('import "server-only";')).toBe(true);
  });
});
