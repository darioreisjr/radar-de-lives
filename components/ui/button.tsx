import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

export const buttonStyles: Record<Variant, string> = {
  primary:
    "bg-accent-pink text-background hover:bg-[#ff5c95] disabled:bg-surface-raised disabled:text-text-secondary",
  ghost:
    "bg-surface text-text-primary ring-1 ring-border-strong hover:bg-surface-raised hover:ring-accent-cyan/60 disabled:text-text-secondary disabled:ring-border disabled:hover:bg-surface disabled:hover:ring-border",
};

export const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors duration-[140ms] disabled:cursor-not-allowed";

export function Button({
  variant = "ghost",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={`${buttonBase} ${buttonStyles[variant]} ${className}`} {...props} />;
}
