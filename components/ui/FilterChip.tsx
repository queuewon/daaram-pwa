import { type Tone } from "./theme";

export interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: Tone;
}

const ACTIVE_CLASS: Record<Tone, string> = {
  brand: "border-transparent bg-brand-soft text-brand",
  ingredient: "border-transparent bg-ingredient-soft text-ingredient",
  data: "border-transparent bg-data-soft text-data",
  danger: "border-transparent bg-red-50 text-danger",
  neutral: "border-transparent bg-gray-100 text-gray-800",
};

export function FilterChip({ label, active, onClick, tone = "brand" }: FilterChipProps) {
  const classes = active
    ? ACTIVE_CLASS[tone]
    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${classes}`}
    >
      {label}
    </button>
  );
}
