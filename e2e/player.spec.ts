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
});

const blocked = [
  { state: "ended", over: {}, title: "Esta live terminou" },
  { state: "upcoming", over: {}, title: "Ainda não começou" },
  { state: "unavailable", over: {}, title: "Vídeo indisponível" },
  { state: "live", over: { embedAllowed: false }, title: "Player indisponível aqui" },
] as const;

for (const c of blocked) {
  test(`revalidação: ${c.title}`, async ({ page, api }) => {
    api.status = (id) => ok(statusPayload(id, c.state, c.over));
    const dialog = await openFirstPlayer(page);
    await expect(dialog.getByText(c.title)).toBeVisible();
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
