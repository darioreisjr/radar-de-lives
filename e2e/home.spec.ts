import { expect, liveItem, livesPayload, ok, sixLives, summary, test } from "./support";

test.describe("aceite da política (spec 016)", () => {
  test.use({ acceptPolicy: false });

  test("primeira visita pede o aceite e só busca lives depois dele", async ({ page, api }) => {
    const thumbs: string[] = [];
    page.on("request", (r) => {
      if (new URL(r.url()).hostname === "i.ytimg.com") thumbs.push(r.url());
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Antes de ver as lives" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Política de Privacidade" }).first()).toHaveAttribute("href", "/privacy");
    expect(api.livesCalls).toHaveLength(0);
    expect(thumbs).toHaveLength(0);

    await page.getByRole("button", { name: "Li e concordo. Continuar" }).click();
    await expect(summary(page)).toHaveText("6 lives encontradas");
    expect(api.livesCalls).toHaveLength(1);

    await page.reload();
    await expect(summary(page)).toHaveText("6 lives encontradas");
    await expect(page.getByRole("heading", { name: "Antes de ver as lives" })).toHaveCount(0);
  });

  test("recusa não carrega a lista", async ({ page, api }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Não concordo" }).click();
    await expect(page.getByText("Sem a concordância, a lista de lives não é carregada.")).toBeVisible();
    expect(api.livesCalls).toHaveLength(0);
  });
});

test("home com lives: painel do radar, um só botão rosa e sem rolagem horizontal", async ({ page }) => {
  await page.goto("/");
  await expect(summary(page)).toHaveText("6 lives encontradas");

  const radar = page.getByRole("region", { name: "Radar" });
  await expect(radar.getByText("6", { exact: true })).toBeVisible();
  await expect(radar.getByText("lives no ar")).toBeVisible();
  const langs = radar.getByRole("listitem");
  await expect(langs).toHaveCount(3);
  await expect(langs.nth(0)).toContainText("Português");
  await expect(langs.nth(0)).toContainText("3");
  await expect(langs.nth(1)).toContainText("Inglês");
  await expect(langs.nth(2)).toContainText("Espanhol");

  await expect(page.getByRole("article")).toHaveCount(6);

  // Rosa só na ação principal do hero (spec 007 D2).
  const pink = await page.evaluate(() =>
    [...document.querySelectorAll("a, button")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).backgroundColor === "rgb(255, 61, 129)";
    }).length,
  );
  expect(pink).toBe(1);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("filtros: texto, idioma e limpar", async ({ page }) => {
  await page.goto("/");
  await expect(summary(page)).toHaveText("6 lives encontradas");

  await page.getByLabel("Buscar nos resultados").fill("Canal simulado 4");
  await expect(summary(page)).toHaveText("1 de 6 lives encontradas");

  await page.getByLabel("Buscar nos resultados").fill("");
  await page.getByLabel("Idioma (estimado)").selectOption("es");
  await expect(summary(page)).toHaveText("1 de 6 lives encontradas");

  await page.getByLabel("Buscar nos resultados").fill("nada com isso");
  await expect(page.getByRole("heading", { name: "Nenhum resultado com esses filtros" })).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(summary(page)).toHaveText("6 lives encontradas");
});

test("carregar mais acrescenta a próxima página", async ({ page, api }) => {
  api.setLives(
    ok(livesPayload(sixLives(), { nextPageToken: "PAGINA2" })),
    ok(livesPayload([liveItem(7), liveItem(8)], { nextPageToken: null })),
  );
  await page.goto("/");
  await expect(summary(page)).toHaveText("6 lives encontradas");

  await page.getByRole("button", { name: "Carregar mais lives" }).click();
  await expect(summary(page)).toHaveText("8 lives encontradas");
  await expect(page.getByRole("button", { name: "Carregar mais lives" })).toHaveCount(0);
  expect(api.livesCalls[1]).toBe("?pageToken=PAGINA2");
});

test("páginas legais abrem com os links obrigatórios", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByText("YouTube API Services").first()).toBeVisible();
  await expect(page.locator('a[href="https://policies.google.com/privacy"]').first()).toBeVisible();
  await expect(page.locator('a[href="https://www.youtube.com/t/terms"]').first()).toBeVisible();
  await page.goto("/terms");
  await expect(page.locator("h1")).toBeVisible();
});
