// Executa o Vitest com a letra do drive normalizada no Windows.
// Motivo: com o terminal em "d:\..." o Vitest normaliza o root para "D:\..."
// e carrega dois módulos "vitest" diferentes, quebrando describe/it.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const fix = (p) => (process.platform === "win32" ? p.replace(/^[a-z]:/, (d) => d.toUpperCase()) : p);
const cwd = fix(fileURLToPath(new URL("../", import.meta.url)));
const bin = fix(fileURLToPath(new URL("../node_modules/vitest/vitest.mjs", import.meta.url)));

const result = spawnSync(process.execPath, [bin, "run", ...process.argv.slice(2)], { cwd, stdio: "inherit" });
process.exit(result.status ?? 1);
