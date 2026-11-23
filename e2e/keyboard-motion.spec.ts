import { expect, summary, test } from "./support";
import type { Page } from "@playwright/test";

/** Aperta Tab até o foco chegar no elemento que satisfaz `match`. */
async function tabUntil(page: Page, match: (el: Element) => boolean, max = 60) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    if (await page.evaluate(`(${match.toString()})(document.activeElement)`)) return i + 1;
  }
  throw new Error("o foco não chegou ao elemento esperado pelo teclado");
}

test("teclado: Tab chega aos filtros e às ações; Esc fecha o player e devolve o foco", async ({ page }) => {
  await page.goto("/");
  await expect(summary(page)).toHaveText("6 lives encontradas");

  await tabUntil(page, (el) => el.id === "filter-q");
  await expect(page.locator("#filter-q")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#filter-lang")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#filter-sort")).toBeFocused();

  await tabUntil(page, (el) => el.textContent?.trim() === "Assistir aqui");
  const trigger = await page.evaluate(() => document.activeElement?.getAttribute("aria-describedby"));
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-describedby"))).toBe(trigger);
  expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe("Assistir aqui");
});

/** Duração da animação em ms (o navegador devolve "0.24s" ou "1e-05s"). */
async function animation(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const s = getComputedStyle(el);
    return { ms: parseFloat(s.animationDuration) * 1000, iterations: s.animationIterationCount };
  });
}

test.describe("movimento reduzido", () => {
  test("com reduce: cards, hero, pulso e diálogo não animam", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(summary(page)).toHaveText("6 lives encontradas");

    expect((await animation(page, "article")).ms).toBeLessThan(1);
    expect((await animation(page, ".animate-rise")).ms).toBeLessThan(1);
    const pulse = await animation(page, ".animate-live-pulse");
    expect(pulse.ms).toBeLessThan(1);
    expect(pulse.iterations).toBe("1");

    await page.getByRole("button", { name: "Assistir aqui" }).first().click();
    expect((await animation(page, "dialog[open]")).ms).toBeLessThan(1);
  });

  test("sem preferência: as animações existem (controle do teste acima)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(summary(page)).toHaveText("6 lives encontradas");

    expect((await animation(page, "article")).ms).toBeCloseTo(240, 0);
    expect((await animation(page, ".animate-live-pulse")).iterations).toBe("infinite");
  });
});
