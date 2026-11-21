/**
 * Cores do design system (PRD §4) + `border-strong` (spec 003 D4).
 * Devem ser iguais às variáveis `--color-*` de app/globals.css (verificado em tests/contrast.test.ts).
 */
export const colors = {
  background: "#09090d",
  surface: "#14141b",
  "surface-raised": "#1d1d27",
  "text-primary": "#f5f2ef",
  "text-secondary": "#b6b3bc",
  "accent-pink": "#ff3d81",
  "accent-cyan": "#32d8e8",
  "accent-violet": "#a76bff",
  "live-red": "#ff3548",
  border: "#33323d",
  /** Contorno de controles interativos: ≥ 3:1 contra fundos (WCAG 1.4.11). */
  "border-strong": "#6e6b7b",
} as const;

export type ColorToken = keyof typeof colors;

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG 2.x entre duas cores #rrggbb. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
