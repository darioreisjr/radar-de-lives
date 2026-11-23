import { apiError, expect, livesPayload, networkFailure, ok, sixLives, summary, test } from "./support";

test("quota esgotada (503)", async ({ page, api }) => {
  api.setLives(apiError("quota_exceeded", 503, "O limite diário de consultas ao YouTube foi atingido. Volte amanhã."));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Limite de consultas atingido" })).toBeVisible();
  await expect(page.getByText("O limite diário de consultas ao YouTube foi atingido.")).toBeVisible();
  await expect(summary(page)).toHaveText("Busca indisponível");
  await expect(page.getByText("Busca indisponível no momento. Os números voltam")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
});

test("YouTube indisponível sem itens (502) e nova tentativa", async ({ page, api }) => {
  api.setLives(apiError("upstream_unavailable", 502, "O YouTube não respondeu."), ok(livesPayload(sixLives())));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Não foi possível buscar as lives" })).toBeVisible();
  await expect(page.getByText("O YouTube não respondeu.")).toBeVisible();

  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(summary(page)).toHaveText("6 lives encontradas");
});

test("YouTube indisponível com itens: mantém a grade e avisa", async ({ page, api }) => {
  api.setLives(ok(livesPayload(sixLives())), apiError("upstream_unavailable", 502, "O YouTube não respondeu."));
  await page.goto("/");
  await expect(summary(page)).toHaveText("6 lives encontradas");

  await page.getByRole("button", { name: "Atualizar", exact: true }).click();
  await expect(page.getByText("Não foi possível atualizar: O YouTube não respondeu. Mostrando os resultados anteriores.")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(6);
  // Cooldown do botão depois de atualizar.
  await expect(page.getByRole("button", { name: /Atualizar/ })).toBeDisabled();
});

test("dados antigos (stale)", async ({ page, api }) => {
  api.setLives(ok(livesPayload(sixLives(), { stale: true, cached: true })));
  await page.goto("/");
  await expect(page.getByText("Mostrando resultados salvos da última consulta")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(6);
  await expect(page.getByText("· do cache")).toBeVisible();
});

test("nenhuma live encontrada", async ({ page, api }) => {
  api.setLives(ok(livesPayload([])));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Nenhuma live encontrada agora" })).toBeVisible();
  await expect(summary(page)).toHaveText("0 lives encontradas");
});

test("sem conexão", async ({ page, api }) => {
  api.setLives(networkFailure);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Não foi possível buscar as lives" })).toBeVisible();
  await expect(page.getByText("Sem conexão com o servidor.")).toBeVisible();
});
