import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Tone } from "./theme";

export type ButtonVariant = "solid" | "soft" | "outline" | "pale";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

const SOLID: Record<Tone, string> = {
  brand: "border-transparent bg-brand text-white hover:opacity-90",
  ingredient: "border-transparent bg-ingredient text-white hover:opacity-90",
  data: "border-transparent bg-data text-white hover:opacity-90",
  danger: "border-transparent bg-danger text-white hover:opacity-90",
  neutral: "border-transparent bg-gray-900 text-white hover:opacity-90",
};

const SOFT: Record<Tone, string> = {
  brand: "border-transparent bg-brand-soft text-brand hover:brightness-95",
  ingredient: "border-transparent bg-ingredient-soft text-ingredient hover:brightness-95",
  data: "border-transparent bg-data-soft text-data hover:brightness-95",
  danger: "border-transparent bg-red-50 text-danger hover:brightness-95",
  neutral: "border-transparent bg-gray-100 text-gray-700 hover:brightness-95",
};

const OUTLINE: Record<Tone, string> = {
  brand: "border-brand text-brand bg-white hover:bg-brand-soft",
  ingredient: "border-ingredient text-ingredient bg-white hover:bg-ingredient-soft",
  data: "border-data text-data bg-white hover:bg-data-soft",
  danger: "border-danger text-danger bg-white hover:bg-red-50",
  neutral: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
};

const PALE: Record<Tone, string> = {
  brand: "border-transparent bg-pink-300 text-white hover:opacity-90",
  ingredient: "border-transparent bg-amber-300 text-white hover:opacity-90",
  data: "border-transparent bg-blue-300 text-white hover:opacity-90",
  danger: "border-transparent bg-red-300 text-white hover:opacity-90",
  neutral: "border-transparent bg-gray-300 text-white hover:opacity-90",
};

const VARIANT_MAP: Record<ButtonVariant, Record<Tone, string>> = {
  solid: SOLID,
  soft: SOFT,
  outline: OUTLINE,
  pale: PALE,
};

export function Button({
  tone = "brand",
  variant = "solid",
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center gap-1 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
    VARIANT_MAP[variant][tone],
    fullWidth ? "w-full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
