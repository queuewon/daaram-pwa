import type { ReactNode } from "react";

export type CardAccent = "brand" | "ingredient" | "data" | "neutral";

export interface CardProps {
  accent?: CardAccent;
  /** Fill the card with the accent's soft tint instead of white. */
  filled?: boolean;
  className?: string;
  children: ReactNode;
}

const ACCENT_BORDER_CLASS: Record<CardAccent, string> = {
  brand: "border-pink-200",
  ingredient: "border-amber-200",
  data: "border-blue-200",
  neutral: "border-gray-200",
};

const ACCENT_FILL_CLASS: Record<CardAccent, string> = {
  brand: "bg-brand-soft",
  ingredient: "bg-ingredient-soft",
  data: "bg-data-soft",
  neutral: "bg-gray-50",
};

export function Card({ accent = "neutral", filled = false, className, children }: CardProps) {
  const classes = [
    "rounded-2xl border p-4 shadow-sm",
    ACCENT_BORDER_CLASS[accent],
    filled ? ACCENT_FILL_CLASS[accent] : "bg-white",
  ];
  if (className) classes.push(className);

  return <div className={classes.join(" ")}>{children}</div>;
}
