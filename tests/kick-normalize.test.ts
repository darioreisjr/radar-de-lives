import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import type { KickClient } from "@/lib/kick/client";
import { kickLanguage, kickThumbnail, kickViewers, normalizeLivestream } from "@/lib/kick/normalize";
import { KICK_DEFAULT_MAX_ITEMS, KICK_DEFAULT_MAX_PAGES, searchKickLives } from "@/lib/kick/search";
import { KickLivestreamSchema, KickLivestreamsPageSchema } from "@/lib/kick/types";
import { LivesError } from "@/lib/youtube/errors";

/** Resposta real de GET /public/v2/livestreams, anonimizada (spec 020, P2). */
const fixture = JSON.parse(readFileSync("tests/fixtures/kick/livestreams-v2.json", "utf-8")) as {
  data: Record<string, unknown>[];
  pagination: { next_cursor: string };
};

const live = (n: number, over: Record<string, unknown> = {}) => ({
  ...fixture.data[0],
  id: `uuid-${n}`,
  title: `Live ${n}`,
  language_code: "pt",
  viewer_count: n,
  channel: { slug: `canal-${n}` },
  broadcaster_user: { id: 1000 + n, username: `Canal_${n}`, profile_picture: "https://files.kick.com/x.webp" },
  ...over,
});

const page = (data: unknown[], next = "") => ({ data, message: "OK", pagination: { next_cursor: next } });

/** Cliente falso: cada chamada a api() consulta o handler e valida com o schema real. */
function fakeClient(handler: (path: string, params: Record<string, string | readonly string[]>) => unknown) {
  const api = vi.fn(async <T,>(path: string, params: Record<string, string | readonly string[]>, schema: z.ZodType<T>) =>
    schema.parse(await handler(path, params)),
  );
  return { client: { api } as unknown as KickClient, api };
}

describe("contrato com a resposta real da Kick (spec 047)", () => {
  it("a página e cada item da fixture passam nos schemas", () => {
    expect(KickLivestreamsPageSchema.safeParse(fixture).success).toBe(true);
    for (const s of fixture.data) expect(KickLivestreamSchema.safeParse(s).success).toBe(true);
  });

  it("CA1: a fixture gera LiveItems válidos com platform kick e id kick:<slug>", () => {
    const items = fixture.data.map((raw, i) => normalizeLivestream(KickLivestreamSchema.parse(raw), i));
    expect(items[0]).toEqual({
      id: "kick:canal_teste_kick_1",
      platform: "kick",
      sourceId: "canal_teste_kick_1",
      title: "GTA VI  Live 24/7 | Nature & Ambience",
      description: "",
      channelId: "1000001",
      channelTitle: "Canal_Teste_Kick_1",
      thumbnailUrl: "https://images.kick.com/video_thumbnails/AAAAAAAAAAAA/BBBBBBBBBBBB/720.webp",
      publishedAt: "2026-11-23T11:17:29.000Z",
      liveStartedAt: "2026-11-23T11:17:29.000Z",
      concurrentViewers: 7,
      language: "en",
      watchUrl: "https://kick.com/canal_teste_kick_1",
      embedUrl: "https://player.kick.com/canal_teste_kick_1?autoplay=false&muted=true",
      isLive: true,
      embedAllowed: true,
      isMature: false, // D6: has_mature_content era true
      rank: 0,
    });
    for (const it of items) {
      expect(it.id).toBe(`kick:${it.sourceId}`);
      expect(it.isMature).toBe(false);
    }
    // Miniatura em web.kick.com também vale; en-IN vira en.
    expect(items[2]).toMatchObject({ thumbnailUrl: expect.stringMatching(/^https:\/\/web\.kick\.com\//), language: "en" });
  });

  it("CA2: viewers ausentes ou inválidos viram null, nunca 0", () => {
    expect(kickViewers(undefined)).toBeNull();
    expect(kickViewers(null)).toBeNull();
    expect(kickViewers("12")).toBeNull();
    expect(kickViewers(-1)).toBeNull();
    expect(kickViewers(0)).toBe(0);
    expect(kickViewers(12.7)).toBe(12);
    const semViewers = KickLivestreamSchema.parse(live(1, { viewer_count: undefined }));
    expect(normalizeLivestream(semViewers, 0).concurrentViewers).toBeNull();
  });

  it("CA3: idioma pelo prefixo; fora de pt/en/es vira unknown", () => {
    expect(["pt", "pt-BR", "en", "en-IN", "es", "es-419", "EN"].map(kickLanguage)).toEqual(["pt", "pt", "en", "en", "es", "es", "en"]);
    expect(["ar", "tr", "", undefined, "ptx"].map(kickLanguage)).toEqual(["unknown", "unknown", "unknown", "unknown", "unknown"]);
  });

  it("CA5: miniatura só com HTTPS nos CDNs esperados", () => {
    expect(kickThumbnail("https://images.kick.com/a/720.webp")).toBe("https://images.kick.com/a/720.webp");
    expect(kickThumbnail("https://web.kick.com/a/720.webp")).toBe("https://web.kick.com/a/720.webp");
    for (const ruim of ["http://images.kick.com/a.webp", "https://files.kick.com/a.webp", "https://images.kick.com.evil.io/a", "//images.kick.com/a", "", null, undefined]) {
      expect(kickThumbnail(ruim)).toBeNull();
    }
  });

  it("título vazio vira 'Sem título'; canal sem nome usa o slug", () => {
    const s = KickLivestreamSchema.parse(live(1, { title: "  ", broadcaster_user: { id: "55", username: "" } }));
    expect(normalizeLivestream(s, 0)).toMatchObject({ title: "Sem título", channelTitle: "canal-1", channelId: "55" });
  });
});

describe("busca na Kick (spec 047)", () => {
  it("parâmetros: v2, categoria, limit=1000; filtra idioma e ordena por espectadores (D1, D4, D5)", async () => {
    const { client, api } = fakeClient(() => page(fixture.data));
    const items = await searchKickLives(client, { categoryId: "13155", log: () => {} });
    expect(api.mock.calls[0][0]).toBe("v2/livestreams");
    expect(api.mock.calls[0][1]).toEqual({ category_id: "13155", limit: "1000" });
    // pt (12114) > en (7) > en-IN (0); ordem da API era a cronológica.
    expect(items.map((i) => [i.sourceId, i.concurrentViewers, i.rank])).toEqual([
      ["canal-teste-kick-2", 12114, 0],
      ["canal_teste_kick_1", 7, 1],
      ["canalteste3", 0, 2],
    ]);
  });

  it("CA6: segue o cursor, sem duplicatas, e para sem cursor", async () => {
    const pages = [page([live(1), live(2)], "c1"), page([live(2), live(3)], "c2"), page([live(4)], "")];
    let n = 0;
    const { client, api } = fakeClient((_p, params) => {
      if (n > 0) expect(params.cursor).toBe(`c${n}`);
      return pages[n++];
    });
    const items = await searchKickLives(client, { categoryId: "1", log: () => {} });
    expect(api).toHaveBeenCalledTimes(3);
    expect(items.map((i) => i.sourceId)).toEqual(["canal-4", "canal-3", "canal-2", "canal-1"]);
  });

  it("CA6: respeita o teto de páginas (padrão 5)", async () => {
    let n = 0;
    const { client, api } = fakeClient(() => page([live(++n)], `c${n}`));
    await searchKickLives(client, { categoryId: "1", log: () => {} });
    expect(api).toHaveBeenCalledTimes(KICK_DEFAULT_MAX_PAGES);
    expect(KICK_DEFAULT_MAX_PAGES).toBe(5);
  });

  it("CA6: fica com as 100 maiores; sem número de espectadores vai para o fim", async () => {
    const many = Array.from({ length: 150 }, (_, i) => live(i + 1));
    const semNumero = live(999, { channel: { slug: "sem-numero" }, viewer_count: null });
    const { client } = fakeClient(() => page([semNumero, ...many]));
    const items = await searchKickLives(client, { categoryId: "1", log: () => {} });
    expect(items).toHaveLength(KICK_DEFAULT_MAX_ITEMS);
    expect(items[0]).toMatchObject({ sourceId: "canal-150", concurrentViewers: 150, rank: 0 });
    expect(items.at(-1)).toMatchObject({ sourceId: "canal-51", rank: 99 });
    const poucos = await searchKickLives(fakeClient(() => page([semNumero, live(3)])).client, { categoryId: "1", log: () => {} });
    expect(poucos.map((i) => i.sourceId)).toEqual(["canal-3", "sem-numero"]);
  });

  it("CA3: idiomas fora de pt/en/es ficam de fora da lista", async () => {
    const { client } = fakeClient(() => page([live(1, { language_code: "ar" }), live(2, { language_code: "es-419" }), live(3, { language_code: "tr" })]));
    const items = await searchKickLives(client, { categoryId: "1", log: () => {} });
    expect(items.map((i) => [i.sourceId, i.language])).toEqual([["canal-2", "es"]]);
  });

  it("CA4: item inválido é descartado e contado; os demais seguem", async () => {
    const log = vi.fn();
    const { client } = fakeClient(() =>
      page([live(1), { title: "sem canal" }, live(2, { channel: { slug: "inválido com espaço" } }), live(3, { broadcaster_user: { username: "x" } }), live(4)]),
    );
    const items = await searchKickLives(client, { categoryId: "1", log });
    expect(items.map((i) => i.sourceId)).toEqual(["canal-4", "canal-1"]);
    expect(log).toHaveBeenCalledWith("kick_error", { stage: "normalize", code: "invalid_item", count: 3 });
  });

  it("D2: falha na 1ª página sobe o erro; falha numa página seguinte mantém as anteriores", async () => {
    const first = fakeClient(() => {
      throw new LivesError("upstream_config");
    });
    await expect(searchKickLives(first.client, { categoryId: "1", log: () => {} })).rejects.toMatchObject({ code: "upstream_config" });

    let n = 0;
    const log = vi.fn();
    const later = fakeClient(() => {
      if (n++ === 0) return page([live(1)], "c1");
      throw new LivesError("upstream_unavailable");
    });
    const items = await searchKickLives(later.client, { categoryId: "1", log });
    expect(items.map((i) => i.sourceId)).toEqual(["canal-1"]);
    expect(log).toHaveBeenCalledWith("kick_error", { stage: "page", page: 1 });
  });

  it("sem lives, devolve lista vazia", async () => {
    const { client } = fakeClient(() => page([]));
    expect(await searchKickLives(client, { categoryId: "1", log: () => {} })).toEqual([]);
  });
});
