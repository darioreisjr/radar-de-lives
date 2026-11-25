import type { LiveItem, Platform, SourceStatus } from "../lib/lives/types";
import { expect, liveItem, livesPayload, ok, sixLives, summary, test } from "./support";

/** Spec 026: selo de plataforma, filtro "Plataforma", aviso parcial e selo "Conteúdo adulto". */

const source = (platform: Platform, okay = true): SourceStatus => ({
  platform,
  ok: okay,
  cached: false,
  stale: false,
  updatedAt: okay ? new Date().toISOString() : null,
  ...(okay ? {} : { errorCode: "upstream_unavailable" as const }),
});

function twitchItem(n: number, over: Partial<LiveItem> = {}): LiveItem {
  const login = `canal_twitch_${n}`;
  return liveItem(n, {
    id: `twitch:${login}`,
    platform: "twitch",
    sourceId: login,
    videoId: login,
    title: `Live da Twitch ${n}`,
    thumbnailUrl: null,
    watchUrl: `https://www.twitch.tv/${login}`,
    embedUrl: "",
    ...over,
  });
}

/** Selos de texto exato dentro dos cards (o link "YouTube" tem texto extra para leitor de tela). */
const cardBadge = (page: import("@playwright/test").Page, text: string) =>
  page.locator("article").getByText(text, { exact: true });

test("uma plataforma ativa: nada novo aparece (CA1)", async ({ page }) => {
  await page.goto("/");
  await expect(summary(page)).toHaveText("6 lives encontradas");
  await expect(page.getByLabel("Plataforma")).toHaveCount(0);
  await expect(cardBadge(page, "YouTube")).toHaveCount(0);
  await expect(page.getByText("Por plataforma")).toHaveCount(0);
  await expect(page.getByText("Algumas plataformas estão indisponíveis")).toHaveCount(0);
});

test("várias plataformas: selos, filtro combinado e contagem (CA2, CA3, CA6)", async ({ page, api }) => {
  api.setLives(
    ok(
      livesPayload([liveItem(1, { language: "pt" }), liveItem(2, { language: "pt" }), twitchItem(3, { language: "en", isMature: true })], {
        sources: [source("youtube"), source("twitch")],
      }),
    ),
  );
  await page.goto("/");
  await expect(summary(page)).toHaveText("3 lives encontradas");

  // Selos de plataforma em cada card, só texto.
  await expect(cardBadge(page, "YouTube")).toHaveCount(2);
  const twitchCard = page.getByRole("article").filter({ hasText: "Live da Twitch 3" });
  await expect(twitchCard.getByText("Twitch", { exact: true })).toBeVisible();
  await expect(twitchCard.getByText("Conteúdo adulto", { exact: true })).toBeVisible();

  // Contagem por plataforma no radar.
  const radar = page.getByRole("region", { name: /Radar/ });
  await expect(radar.getByText("Por plataforma")).toBeVisible();

  // Filtro com rótulo acessível, só com as plataformas ativas.
  const filtro = page.getByLabel("Plataforma");
  await expect(filtro.locator("option")).toHaveText(["Todas", "YouTube", "Twitch"]);
  await filtro.focus();
  await expect(filtro).toBeFocused();
  await filtro.selectOption("twitch");
  await expect(summary(page)).toHaveText("1 de 3 lives encontradas");
  await expect(page.getByRole("article")).toHaveCount(1);

  // Combina com idioma: Twitch + Português → vazio com opção de limpar.
  await page.getByLabel("Idioma (estimado)").selectOption("pt");
  await expect(page.getByRole("article")).toHaveCount(0);
  await page.getByRole("button", { name: /Limpar filtros/ }).click();
  await expect(page.getByRole("article")).toHaveCount(3);
  await expect(filtro).toHaveValue("all");
});

test("resultado parcial: aviso com role=status (CA4)", async ({ page, api }) => {
  api.setLives(ok(livesPayload(sixLives(), { sources: [source("youtube"), source("twitch", false)] })));
  await page.goto("/");
  await expect(summary(page)).toHaveText("6 lives encontradas");
  await expect(page.getByRole("status").filter({ hasText: "Algumas plataformas estão indisponíveis agora" })).toBeVisible();
});

test("selo de conteúdo adulto aparece mesmo com uma plataforma", async ({ page, api }) => {
  api.setLives(ok(livesPayload([liveItem(1, { isMature: true }), liveItem(2)])));
  await page.goto("/");
  await expect(cardBadge(page, "Conteúdo adulto")).toHaveCount(1);
  await expect(page.getByLabel("Plataforma")).toHaveCount(0);
});

test("miniatura da Twitch carrega sem violar a CSP (spec 031)", async ({ page, api }) => {
  const thumb = "https://static-cdn.jtvnw.net/previews-ttv/live_user_canal_twitch_1-640x360.jpg";
  api.setLives(
    ok(livesPayload([liveItem(1), twitchItem(2, { thumbnailUrl: thumb })], { sources: [source("youtube"), source("twitch")] })),
  );
  const twitchRequests: string[] = [];
  page.on("request", (r) => {
    if (/(^|\.)jtvnw\.net$|(^|\.)twitch\.tv$/.test(new URL(r.url()).hostname)) twitchRequests.push(r.url());
  });
  await page.goto("/");
  const card = page.getByRole("article").filter({ hasText: "Live da Twitch 2" });
  const img = card.locator("img");
  await expect(img).toHaveAttribute("src", thumb);
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  // A requisição é feita pelo navegador, mas respondida localmente pelo teste (nada sai para a Twitch).
  expect(twitchRequests).toEqual([thumb]);
});
