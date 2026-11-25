import { apiError, expect, liveItem, livesPayload, ok, statusPayload, summary, test, videoId } from "./support";
import type { Page } from "@playwright/test";

async function openFirstPlayer(page: Page) {
  await page.goto("/");
  await expect(summary(page)).toHaveText("6 lives encontradas");
  await page.getByRole("button", { name: "Assistir aqui" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

test("live confirmada: consentimento e iframe oficial sem autoplay", async ({ page, api }) => {
  const dialog = await openFirstPlayer(page);
  await expect(dialog.getByRole("link", { name: "Política de Privacidade do Google" })).toBeVisible();
  await expect(dialog.locator("iframe")).toHaveCount(0);

  await dialog.getByRole("button", { name: "Carregar player" }).click();
  const iframe = dialog.locator("iframe");
  await expect(iframe).toHaveAttribute("src", `https://www.youtube.com/embed/${videoId(1)}?playsinline=1&rel=0`);
  await expect(iframe).toHaveAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  expect(await iframe.getAttribute("src")).not.toContain("autoplay");
  expect(await iframe.getAttribute("allow")).not.toContain("autoplay");
  expect(api.statusCalls).toEqual([videoId(1)]);
  // Revalidação pela rota de status por plataforma (spec 025 CA2).
  expect(api.statusPaths).toEqual([`/api/status/youtube/${videoId(1)}`]);
});

const blocked = [
  { state: "ended", over: {}, title: "Esta live terminou", badge: "Encerrada" },
  { state: "upcoming", over: {}, title: "Ainda não começou", badge: "Agendada" },
  { state: "unavailable", over: {}, title: "Vídeo indisponível", badge: "Indisponível" },
  { state: "live", over: { embedAllowed: false }, title: "Player indisponível aqui", badge: "Ao vivo" },
] as const;

for (const c of blocked) {
  test(`revalidação: ${c.title}`, async ({ page, api }) => {
    api.status = (id) => ok(statusPayload(id, c.state, c.over));
    const dialog = await openFirstPlayer(page);
    await expect(dialog.getByText(c.title)).toBeVisible();
    // Selo do cabeçalho segue o estado revalidado (spec 018).
    await expect(dialog.locator("span.rounded-md").first()).toHaveText(c.badge);
    await expect(dialog.locator("iframe")).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "Carregar player" })).toHaveCount(0);
    await expect(dialog.getByRole("link", { name: /Abrir no YouTube/ })).toHaveAttribute(
      "href",
      `https://www.youtube.com/watch?v=${videoId(1)}`,
    );
  });
}

test("live encerrada atualiza o card depois de fechar", async ({ page, api }) => {
  api.status = (id) => ok(statusPayload(id, "ended"));
  const dialog = await openFirstPlayer(page);
  await expect(dialog.getByText("Esta live terminou")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  const card = page.getByRole("article").filter({ hasText: "Live simulada 1 de teste" });
  await expect(card.getByText("Live encerrada após a busca")).toBeVisible();
  await expect(card.getByRole("button", { name: "Assistir aqui" })).toHaveCount(0);
});

test("falha na revalidação: permite o player com aviso", async ({ page, api }) => {
  api.status = () => apiError("upstream_unavailable", 502, "O YouTube não respondeu.");
  const dialog = await openFirstPlayer(page);
  await expect(dialog.getByText("Não conseguimos confirmar se a live continua.")).toBeVisible();
  await dialog.getByRole("button", { name: "Carregar player" }).click();
  await expect(dialog.locator("iframe")).toBeVisible();
});

test("incorporação desativada na lista: sem botão Assistir aqui", async ({ page, api }) => {
  api.setLives(ok(livesPayload([liveItem(1, { embedAllowed: false }), liveItem(2)])));
  await page.goto("/");
  const card = page.getByRole("article").filter({ hasText: "Live simulada 1 de teste" });
  await expect(card.getByText("Incorporação desativada pelo canal")).toBeVisible();
  await expect(card.getByRole("button", { name: "Assistir aqui" })).toHaveCount(0);
});

test("plataforma sem player embutido: modo só-link (spec 025 CA3)", async ({ page, api }) => {
  const twitch = liveItem(1, {
    id: "twitch:canal_teste",
    platform: "twitch",
    sourceId: "canal_teste",
    videoId: "canal_teste",
    title: "Live simulada da Twitch",
    thumbnailUrl: null,
    watchUrl: "https://www.twitch.tv/canal_teste",
    embedUrl: "",
  });
  api.setLives(ok(livesPayload([twitch, liveItem(2)])));
  await page.goto("/");
  const card = page.getByRole("article").filter({ hasText: "Live simulada da Twitch" });
  await expect(card.getByRole("link", { name: /^Twitch/ })).toHaveAttribute("href", "https://www.twitch.tv/canal_teste");

  await card.getByRole("button", { name: "Assistir aqui" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Assista na Twitch")).toBeVisible();
  await expect(dialog.locator("iframe")).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Carregar player" })).toHaveCount(0);
  const link = dialog.getByRole("link", { name: /Abrir na Twitch/ });
  await expect(link).toHaveAttribute("href", "https://www.twitch.tv/canal_teste");
  await link.focus();
  await expect(link).toBeFocused();
  expect(api.statusPaths).toEqual(["/api/status/twitch/canal_teste"]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
