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
  await expect(dialog.locator("p", { hasText: "conforme a Política de Privacidade do Google" })).toBeVisible();
  await expect(dialog.locator("iframe")).toHaveCount(0);

  // Spec 044 (CA2): o YouTube não tem aviso de login.
  await expect(dialog.getByText(/entre na sua conta|pedir login/)).toHaveCount(0);

  await dialog.getByRole("button", { name: "Carregar player" }).click();
  await expect(dialog.getByText("Se o player não carregar ou mostrar erro, abra no YouTube.")).toBeVisible();
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

const kickLive = () =>
  liveItem(1, {
    id: "kick:canal-teste",
    platform: "kick",
    sourceId: "canal-teste",
    title: "Live simulada da Kick",
    thumbnailUrl: null,
    watchUrl: "https://kick.com/canal-teste",
    embedUrl: "https://player.kick.com/canal-teste?autoplay=false&muted=true",
  });

/** Player da Kick respondido no próprio teste: nada sai para a Kick (spec 051 D5). */
async function fakeKickPlayer(page: Page) {
  await page.route(
    (u) => u.hostname === "player.kick.com",
    (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><title>Player simulado</title><p>player</p>" }),
  );
}

test("Kick: consentimento e player oficial, com link de fallback (spec 051 CA1, CA2, CA4)", async ({ page, api }) => {
  await fakeKickPlayer(page);
  api.setLives(ok(livesPayload([kickLive(), liveItem(2)])));
  await page.goto("/");
  const card = page.getByRole("article").filter({ hasText: "Live simulada da Kick" });
  await expect(card.getByRole("link", { name: /^Kick/ })).toHaveAttribute("href", "https://kick.com/canal-teste");
  const trigger = card.getByRole("button", { name: "Assistir aqui" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  expect(api.statusPaths).toEqual(["/api/status/kick/canal-teste"]);

  // Consentimento com a política da Kick antes do iframe (D2); sem aviso de login (D3).
  await expect(dialog.getByRole("link", { name: "Política de Privacidade da Kick" })).toHaveAttribute("href", "https://kick.com/privacy-policy");
  await expect(dialog.locator("p", { hasText: "carregado da Kick, que pode coletar dados de uso conforme a Política de Privacidade da Kick" })).toBeVisible();
  await expect(dialog.getByText(/entre na sua conta|pedir login/)).toHaveCount(0);
  await expect(dialog.locator("iframe")).toHaveCount(0);
  const link = dialog.getByRole("link", { name: /Abrir na Kick/ });
  await expect(link).toHaveAttribute("href", "https://kick.com/canal-teste");

  await dialog.getByRole("button", { name: "Carregar player" }).click();
  const iframe = dialog.locator("iframe");
  await expect(iframe).toHaveAttribute("src", "https://player.kick.com/canal-teste?autoplay=false&muted=true");
  await expect(iframe).toHaveAttribute("title", "Player da Kick: Live simulada da Kick");
  await expect(dialog.getByText("Se o player não carregar ou mostrar erro, abra na Kick.")).toBeVisible();
  await expect(link).toBeVisible();

  // Acessibilidade (CA4): Esc fecha e o foco volta ao card.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Kick: live encerrada na revalidação não carrega o player e mantém o link (spec 051 CA3)", async ({ page, api }) => {
  await fakeKickPlayer(page);
  api.setLives(ok(livesPayload([kickLive(), liveItem(2)])));
  api.status = (id, platform) => ok(statusPayload(id, "ended", { platform }));
  await page.goto("/");
  await page.getByRole("article").filter({ hasText: "Live simulada da Kick" }).getByRole("button", { name: "Assistir aqui" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Esta live terminou")).toBeVisible();
  await expect(dialog.getByText("A Kick pode ter a gravação.", { exact: false })).toBeVisible();
  await expect(dialog.getByText("Encerrada", { exact: true })).toBeVisible();
  await expect(dialog.locator("iframe")).toHaveCount(0);
  await expect(dialog.getByRole("link", { name: /Abrir na Kick/ })).toBeVisible();
});

const twitchLive = () =>
  liveItem(1, {
    id: "twitch:canal_teste",
    platform: "twitch",
    sourceId: "canal_teste",
    title: "Live simulada da Twitch",
    thumbnailUrl: null,
    watchUrl: "https://www.twitch.tv/canal_teste",
    embedUrl: "",
  });

test("Twitch: consentimento e player oficial; tela estreita mostra só o link (spec 032)", async ({ page, api }, info) => {
  api.setLives(ok(livesPayload([twitchLive(), liveItem(2)])));
  await page.goto("/");
  const card = page.getByRole("article").filter({ hasText: "Live simulada da Twitch" });
  const trigger = card.getByRole("button", { name: "Assistir aqui" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  expect(api.statusPaths).toEqual(["/api/status/twitch/canal_teste"]);
  const link = dialog.getByRole("link", { name: /Abrir na Twitch/ });
  await expect(link).toHaveAttribute("href", "https://www.twitch.tv/canal_teste");

  if (info.project.name === "mobile-375") {
    // 375 px < 400 + margens: a Twitch exige 400×300 (CA4).
    await expect(dialog.getByText("Tela estreita para o player")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Carregar player" })).toHaveCount(0);
    await expect(dialog.locator("iframe")).toHaveCount(0);
  } else {
    // Consentimento com o aviso de privacidade da Twitch antes do iframe (D4).
    await expect(dialog.getByRole("link", { name: "Aviso de Privacidade da Twitch" })).toHaveAttribute(
      "href",
      "https://legal.twitch.com/legal/privacy-notice/",
    );
    // Concordância: "o Aviso", não "a Aviso" (spec 032).
    await expect(dialog.locator("p", { hasText: "conforme o Aviso de Privacidade da Twitch" })).toBeVisible();
    // Spec 044: aviso de login antes do botão, como texto do diálogo (CA1, CA3).
    const aviso = dialog.locator("p", { hasText: "pode pedir que você entre na sua conta" });
    await expect(aviso).toBeVisible();
    const [avisoY, botaoY] = await Promise.all([
      aviso.boundingBox().then((b) => b!.y),
      dialog.getByRole("button", { name: "Carregar player" }).boundingBox().then((b) => b!.y),
    ]);
    expect(avisoY).toBeLessThan(botaoY);
    await expect(dialog.locator("iframe")).toHaveCount(0);
    await dialog.getByRole("button", { name: "Carregar player" }).click();
    const iframe = dialog.locator("iframe");
    const host = new URL(page.url()).hostname;
    await expect(iframe).toHaveAttribute(
      "src",
      `https://player.twitch.tv/?channel=canal_teste&parent=${host}&autoplay=false&muted=true`,
    );
    await expect(iframe).toHaveAttribute("title", "Player da Twitch: Live simulada da Twitch");
    const box = await iframe.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(400);
    expect(box!.height).toBeGreaterThanOrEqual(300);
    // Rodapé com o player carregado cita o login (CA4).
    await expect(dialog.getByText("Se a Twitch pedir login ou o player não carregar, abra na Twitch.")).toBeVisible();
  }
  // Acessibilidade do diálogo (CA4): Esc fecha e o foco volta ao card.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Twitch: live encerrada na revalidação não carrega o player e mantém o link (spec 032 CA3)", async ({ page, api }) => {
  api.setLives(ok(livesPayload([twitchLive(), liveItem(2)])));
  api.status = (id, platform) => ok(statusPayload(id, "ended", { platform }));
  await page.goto("/");
  await page.getByRole("article").filter({ hasText: "Live simulada da Twitch" }).getByRole("button", { name: "Assistir aqui" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Esta live terminou")).toBeVisible();
  await expect(dialog.getByText("A Twitch pode ter a gravação.", { exact: false })).toBeVisible();
  await expect(dialog.locator("iframe")).toHaveCount(0);
  await expect(dialog.getByRole("link", { name: /Abrir na Twitch/ })).toBeVisible();
});

/* Spec 045: foco ao fechar o player de uma live encerrada ou indisponível (CA1, CA3). */
for (const state of ["ended", "unavailable"] as const) {
  for (const platform of ["youtube", "twitch"] as const) {
    test(`foco volta ao card ao fechar: ${platform} ${state}`, async ({ page, api }) => {
      const item = platform === "twitch" ? twitchLive() : liveItem(1);
      api.setLives(ok(livesPayload([item, liveItem(2)])));
      api.status = (id, p) => ok(statusPayload(id, state, { platform: p }));
      await page.goto("/");
      const card = page.getByRole("article").filter({ hasText: item.title });
      await card.getByRole("button", { name: "Assistir aqui" }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("link", { name: /Abrir (no YouTube|na Twitch)/ })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      const label = platform === "twitch" ? /Abrir na Twitch/ : /Abrir no YouTube/;
      await expect(card.getByRole("link", { name: label })).toBeFocused();
    });
  }
}

/* Spec 055 (#102): o foco precisa estar no card IMEDIATAMENTE depois do Esc, sem esperar o evento
 * "close" do <dialog> (que o navegador entrega ~100 ms depois quando a página está ocupada). */
for (const state of ["live", "ended", "unavailable"] as const) {
  test(`foco no card logo depois do Esc, sem estado intermediário: ${state} (spec 055)`, async ({ page, api }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    const kick = liveItem(6, {
      id: "kick:canal-kick-6",
      platform: "kick",
      sourceId: "canal-kick-6",
      title: "Live da Kick 6",
      thumbnailUrl: null,
      watchUrl: "https://kick.com/canal-kick-6",
    });
    await page.route((u) => u.hostname === "player.kick.com", (r) => r.fulfill({ contentType: "text/html", body: "<p>player</p>" }));
    const sources = (["youtube", "twitch", "kick"] as const).map((platform) => ({ platform, ok: true, cached: false, stale: false, updatedAt: new Date().toISOString() }));
    api.setLives(ok(livesPayload([liveItem(1), twitchLive(), kick, liveItem(2), liveItem(3), liveItem(4), liveItem(5), liveItem(7), liveItem(8)], { sources })));
    api.status = (id, platform) => ok(statusPayload(id, state, { platform }));
    await page.goto("/");
    const card = page.getByRole("article").filter({ hasText: "Live da Kick 6" });
    await card.getByRole("button", { name: "Assistir aqui" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(state === "live" ? "Carregar player" : /Esta live terminou|Vídeo indisponível/)).toBeVisible();
    // Esc e leitura do foco na mesma tarefa: nenhuma espera pelo evento "close".
    const focused = await page.evaluate(() => {
      const d = document.querySelector("dialog")!;
      d.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      const ev = new Event("cancel", { cancelable: true });
      if (d.dispatchEvent(ev)) d.close();
      const el = document.activeElement as HTMLElement;
      return { inDialog: !!el.closest("dialog"), text: (el.textContent ?? "").trim() };
    });
    expect(focused.inDialog, "foco não pode ficar no diálogo fechado").toBe(false);
    expect(focused.text).toContain(state === "live" ? "Assistir aqui" : "Abrir na Kick");
    await expect(dialog).toBeHidden();
  });
}
