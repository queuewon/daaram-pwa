export type Tone = "brand" | "ingredient" | "data" | "danger" | "neutral";

export const TONE_TEXT: Record<Tone, string> = {
  brand: "text-brand",
  ingredient: "text-ingredient",
  data: "text-data",
  danger: "text-danger",
  neutral: "text-gray-800",
};

export const TONE_DOT: Record<Tone, string> = {
  brand: "bg-brand",
  ingredient: "bg-ingredient",
  data: "bg-data",
  danger: "bg-danger",
  neutral: "bg-gray-400",
};

export const TONE_SOFT_BG: Record<Tone, string> = {
  brand: "bg-brand-soft",
  ingredient: "bg-ingredient-soft",
  data: "bg-data-soft",
  danger: "bg-red-50",
  neutral: "bg-gray-50",
};

/** Light tinted borders that read as the tone without shouting (mockup style). */
export const TONE_SOFT_BORDER: Record<Tone, string> = {
  brand: "border-pink-200",
  ingredient: "border-amber-200",
  data: "border-blue-200",
  danger: "border-red-200",
  neutral: "border-gray-200",
};
