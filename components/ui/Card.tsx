import type { ReactNode } from "react";

export type CardAccent = "brand" | "ingredient" | "data" | "neutral";

export interface CardProps {
  accent?: CardAccent;
  className?: string;
  children: ReactNode;
}

const ACCENT_BORDER_CLASS: Record<CardAccent, string> = {
  brand: "border-brand",
  ingredient: "border-ingredient",
  data: "border-data",
  neutral: "border-gray-200",
};

export function Card({ accent = "neutral", className, children }: CardProps) {
  const classes = ["rounded-2xl border bg-white p-4 shadow-sm", ACCENT_BORDER_CLASS[accent]];
  if (className) classes.push(className);

  return <div className={classes.join(" ")}>{children}</div>;
}
