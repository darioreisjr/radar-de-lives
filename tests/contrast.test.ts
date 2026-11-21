import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { colors, contrastRatio, type ColorToken } from "@/lib/config/design-tokens";

const SURFACES: ColorToken[] = ["background", "surface", "surface-raised"];

/** Texto: ≥ 4,5:1 (WCAG 1.4.3). Pares realmente usados na interface. */
const TEXT: [string, string, string][] = [
  ...SURFACES.flatMap((bg) => [
    [`text-primary sobre ${bg}`, colors["text-primary"], colors[bg]],
    [`text-secondary sobre ${bg}`, colors["text-secondary"], colors[bg]],
    [`accent-cyan sobre ${bg}`, colors["accent-cyan"], colors[bg]],
  ] as [string, string, string][]),
  ["texto do botão primário (background sobre accent-pink)", colors.background, colors["accent-pink"]],
  ["texto do botão primário em hover (#ff5c95)", colors.background, "#ff5c95"],
  ["texto do selo simulado (#d7c2ff) sobre surface", "#d7c2ff", colors.surface],
];

/** Componentes e indicadores: ≥ 3:1 (WCAG 1.4.11). */
const NON_TEXT: [string, string, string][] = [
  ...SURFACES.flatMap((bg) => [
    [`border-strong (controles) sobre ${bg}`, colors["border-strong"], colors[bg]],
    [`foco (accent-cyan) sobre ${bg}`, colors["accent-cyan"], colors[bg]],
  ] as [string, string, string][]),
  ["ponto AO VIVO (live-red) sobre background", colors["live-red"], colors.background],
  ["botão primário (accent-pink) sobre background", colors["accent-pink"], colors.background],
];

describe("contraste WCAG (CA5)", () => {
  it.each(TEXT)("%s ≥ 4,5:1", (_, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
  it.each(NON_TEXT)("%s ≥ 3:1", (_, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(3);
  });
  it("fórmula confere com valores de referência", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 1);
  });
});

describe("tokens sincronizados com globals.css", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8").toLowerCase();
  it.each(Object.entries(colors))("--color-%s = %s", (name, value) => {
    expect(css).toContain(`--color-${name}: ${value};`);
  });
});
