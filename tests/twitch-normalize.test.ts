import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { LivesError } from "@/lib/youtube/errors";
import type { TwitchClient } from "@/lib/twitch/client";
import { isAdult, normalizeStream, twitchLanguage, twitchThumbnail, twitchViewers } from "@/lib/twitch/normalize";
import { searchTwitchLives, TWITCH_DEFAULT_MAX_PAGES } from "@/lib/twitch/search";
import { TwitchStreamSchema, TwitchStreamsPageSchema } from "@/lib/twitch/types";

/** Resposta real de GET /helix/streams, anonimizada (spec 019). */
const fixture = JSON.parse(readFileSync("tests/fixtures/twitch/streams.json", "utf-8")) as {
  data: Record<string, unknown>[];
  pagination: { cursor: string };
};

const stream = (n: number, over: Record<string, unknown> = {}) => ({
  ...fixture.data[0],
  id: `id_${n}`,
  user_id: `u_${n}`,
  user_login: `canal_${n}`,
  user_name: `Canal_${n}`,
  language: "pt",
  viewer_count: 1000 - n,
  ...over,
});

/** Cliente falso: cada chamada a helix() consulta o handler e valida com o schema real. */
function fakeClient(handler: (path: string, params: Record<string, string | readonly string[]>) => unknown) {
  const helix = vi.fn(async <T,>(path: string, params: Record<string, string | readonly string[]>, schema: z.ZodType<T>) =>
    schema.parse(await handler(path, params)),
  );
  return { client: { helix, rateLimit: () => null } as unknown as TwitchClient, helix };
}

describe("contrato com a resposta real da Twitch (spec 028)", () => {
  it("a página e cada item da fixture passam nos schemas", () => {
    expect(TwitchStreamsPageSchema.safeParse(fixture).success).toBe(true);
    for (const s of fixture.data) expect(TwitchStreamSchema.safeParse(s).success).toBe(true);
  });

  it("CA1: a fixture gera LiveItems válidos com platform twitch e id twitch:<login>", () => {
    const items = fixture.data.map((raw, i) => normalizeStream(TwitchStreamSchema.parse(raw), i, false));
    expect(items[0]).not.toHaveProperty("videoId"); // spec 053
    expect(items[0]).toMatchObject({
      id: "twitch:canal_teste_de",
      platform: "twitch",
      sourceId: "canal_teste_de",
      title: "[DROPS] GTA6 Story & Easter Eggs | Drops aktiv",
      channelId: "10000001",
      channelTitle: "Canal_Teste_DE",
      thumbnailUrl: "https://static-cdn.jtvnw.net/previews-ttv/live_user_canal_teste_de-640x360.jpg",
      publishedAt: "2026-11-25T07:56:24.000Z",
      liveStartedAt: "2026-11-25T07:56:24.000Z",
      concurrentViewers: 21449,
      language: "unknown", // de
      watchUrl: "https://www.twitch.tv/canal_teste_de",
      embedUrl: "",
      isLive: true,
      embedAllowed: true,
      isMature: false,
      rank: 0,
    });
    expect(items[1]).toMatchObject({ language: "unknown", rank: 1, concurrentViewers: 9625 }); // ja
  });
});

describe("normalização (spec 028)", () => {
  it("CA2: espectadores ausentes ou inválidos viram null, nunca 0", () => {
    expect(twitchViewers(undefined)).toBeNull();
    expect(twitchViewers("42")).toBeNull();
    expect(twitchViewers(-1)).toBeNull();
    expect(twitchViewers(0)).toBe(0);
    expect(twitchViewers(12.7)).toBe(12);
  });

  it("CA3: idioma fora de pt/en/es vira unknown", () => {
    expect(twitchLanguage("pt")).toBe("pt");
    expect(twitchLanguage("pt-br")).toBe("pt");
    expect(twitchLanguage("EN")).toBe("en");
    expect(twitchLanguage("es")).toBe("es");
    expect(twitchLanguage("ru")).toBe("unknown");
    expect(twitchLanguage("other")).toBe("unknown");
    expect(twitchLanguage(undefined)).toBe("unknown");
  });

  it("CA5: miniatura só em HTTPS no CDN da Twitch", () => {
    expect(twitchThumbnail("https://static-cdn.jtvnw.net/previews-ttv/live_user_x-{width}x{height}.jpg")).toBe(
      "https://static-cdn.jtvnw.net/previews-ttv/live_user_x-640x360.jpg",
    );
    expect(twitchThumbnail("http://static-cdn.jtvnw.net/x.jpg")).toBeNull();
    expect(twitchThumbnail("https://evil.example/static-cdn.jtvnw.net/x.jpg")).toBeNull();
    expect(twitchThumbnail("")).toBeNull();
  });

  it("título vazio e nome vazio têm fallback; login vira minúsculas", () => {
    const s = TwitchStreamSchema.parse(stream(1, { title: "  ", user_name: "", user_login: "Canal_X" }));
    expect(normalizeStream(s, 0, false)).toMatchObject({ title: "Sem título", channelTitle: "Canal_X", sourceId: "canal_x", id: "twitch:canal_x" });
  });

  it("D1: rótulos do streamer contam como adulto; MatureGame sozinho não", () => {
    expect(isAdult(["MatureGame"])).toBe(false);
    expect(isAdult(["DebatedSocialIssuesAndPolitics"])).toBe(false);
    expect(isAdult([])).toBe(false);
    for (const l of ["SexualThemes", "DrugsIntoxication", "ViolentGraphic", "ProfanityVulgarity", "Gambling"]) {
      expect(isAdult(["MatureGame", l])).toBe(true);
    }
  });
});

describe("busca na Twitch (spec 028)", () => {
  it("parâmetros: categoria, idiomas pt/en/es, type=live, first=100", async () => {
    const { client, helix } = fakeClient((path) => (path === "streams" ? { data: [stream(1)], pagination: {} } : { data: [] }));
    await searchTwitchLives(client, { gameId: "1867279146", log: () => {} });
    expect(helix.mock.calls[0][0]).toBe("streams");
    expect(helix.mock.calls[0][1]).toEqual({ game_id: "1867279146", language: ["pt", "en", "es"], type: "live", first: "100" });
  });

  it("CA6: com maxPages 3, até 3 páginas, sem duplicatas entre páginas, para sem cursor", async () => {
    const pages = [
      { data: [stream(1), stream(2)], pagination: { cursor: "c1" } },
      { data: [stream(2), stream(3)], pagination: { cursor: "c2" } }, // stream 2 repetido
      { data: [stream(4)], pagination: { cursor: "c3" } },
      { data: [stream(5)], pagination: {} }, // não deve ser pedida (limite de 3)
    ];
    let n = 0;
    const { client, helix } = fakeClient((path, params) => {
      if (path === "channels") return { data: [] };
      if (n > 0) expect(params.after).toBe(`c${n}`);
      return pages[n++];
    });
    const items = await searchTwitchLives(client, { gameId: "1", maxPages: 3, log: () => {} });
    expect(items.map((i) => i.sourceId)).toEqual(["canal_1", "canal_2", "canal_3", "canal_4"]);
    expect(items.map((i) => i.rank)).toEqual([0, 1, 2, 3]);
    expect(helix.mock.calls.filter((c) => c[0] === "streams")).toHaveLength(3);

    n = 0;
    const one = fakeClient((path) => (path === "channels" ? { data: [] } : { data: [stream(1)], pagination: {} }));
    await searchTwitchLives(one.client, { gameId: "1", log: () => {} });
    expect(one.helix.mock.calls.filter((c) => c[0] === "streams")).toHaveLength(1);
  });

  it("CA6: /helix/channels em lotes de até 100 e selo pelos rótulos (D1)", async () => {
    const many = Array.from({ length: 150 }, (_, i) => stream(i));
    const { client, helix } = fakeClient((path, params) => {
      if (path === "streams") return { data: many, pagination: {} };
      const ids = params.broadcaster_id as string[];
      return {
        data: ids.map((id) => ({
          broadcaster_id: id,
          content_classification_labels: id === "u_3" ? ["MatureGame", "ProfanityVulgarity"] : ["MatureGame"],
        })),
      };
    });
    const items = await searchTwitchLives(client, { gameId: "1", maxPages: 1, log: () => {} });
    const lotes = helix.mock.calls.filter((c) => c[0] === "channels").map((c) => (c[1].broadcaster_id as string[]).length);
    expect(lotes).toEqual([100, 50]);
    expect(items.filter((i) => i.isMature).map((i) => i.sourceId)).toEqual(["canal_3"]);
  });

  it("CA4: item inválido é descartado e contado; os demais seguem", async () => {
    const log = vi.fn();
    const { client } = fakeClient((path) =>
      path === "channels"
        ? { data: [] }
        : { data: [stream(1), { id: "sem_login" }, stream(2, { user_login: "inválido com espaço" }), stream(3)], pagination: {} },
    );
    const items = await searchTwitchLives(client, { gameId: "1", log });
    expect(items.map((i) => i.sourceId)).toEqual(["canal_1", "canal_3"]);
    expect(log).toHaveBeenCalledWith("twitch_error", { stage: "normalize", code: "invalid_item", count: 2 });
  });

  it("CA7: falha em /helix/channels mantém a lista sem selo (D4)", async () => {
    const log = vi.fn();
    const { client } = fakeClient((path) => {
      if (path === "channels") throw new LivesError("rate_limited", 5);
      return { data: [stream(1)], pagination: {} };
    });
    const items = await searchTwitchLives(client, { gameId: "1", log });
    expect(items).toHaveLength(1);
    expect(items[0].isMature).toBe(false);
    expect(log).toHaveBeenCalledWith("twitch_error", { stage: "channels" });
  });

  it("CA7: falha na 1ª página sobe o erro; falha numa página seguinte mantém as anteriores (D5)", async () => {
    const first = fakeClient(() => {
      throw new LivesError("upstream_config");
    });
    await expect(searchTwitchLives(first.client, { gameId: "1", log: () => {} })).rejects.toMatchObject({ code: "upstream_config" });

    let n = 0;
    const log = vi.fn();
    const later = fakeClient((path) => {
      if (path === "channels") return { data: [] };
      if (n++ === 0) return { data: [stream(1)], pagination: { cursor: "c1" } };
      throw new LivesError("upstream_unavailable");
    });
    const items = await searchTwitchLives(later.client, { gameId: "1", maxPages: 3, log });
    expect(items.map((i) => i.sourceId)).toEqual(["canal_1"]);
    expect(log).toHaveBeenCalledWith("twitch_error", { stage: "streams_page", page: 1 });
  });

  it("spec 035 CA1: por padrão, só a 1ª página (até 100 lives), mesmo com cursor", async () => {
    const { client, helix } = fakeClient((path) =>
      path === "channels" ? { data: [] } : { data: Array.from({ length: 100 }, (_, i) => stream(i)), pagination: { cursor: "c1" } },
    );
    const items = await searchTwitchLives(client, { gameId: "1", log: () => {} });
    expect(items).toHaveLength(100);
    expect(helix.mock.calls.filter((c) => c[0] === "streams")).toHaveLength(1);
    expect(TWITCH_DEFAULT_MAX_PAGES).toBe(1);
  });

  it("sem streams, não chama /helix/channels", async () => {
    const { client, helix } = fakeClient(() => ({ data: [], pagination: {} }));
    expect(await searchTwitchLives(client, { gameId: "1", log: () => {} })).toEqual([]);
    expect(helix.mock.calls.filter((c) => c[0] === "channels")).toHaveLength(0);
  });
});
