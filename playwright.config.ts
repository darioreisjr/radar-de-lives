import { defineConfig, devices } from "@playwright/test";

/**
 * Testes de interface (spec 014 / sprint S-09).
 * Rodam contra `next build && next start`, sem chave do YouTube e sem quota:
 * - YOUTUBE_API_KEY vazia no servidor (o .env.local não sobrescreve variáveis já definidas);
 * - toda chamada a /api/ no navegador é simulada em e2e/support.ts;
 * - miniaturas (i.ytimg.com) e o player (www.youtube.com) são respondidos localmente.
 */
const PORT = 3100;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile-375", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 } } },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT} -H 127.0.0.1`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: { YOUTUBE_API_KEY: "", NEXT_TELEMETRY_DISABLED: "1" },
  },
});
