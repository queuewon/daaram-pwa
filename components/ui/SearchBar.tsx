import type { ChangeEvent } from "react";
import type { Tone } from "./theme";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tone?: Tone;
}

const TONE_BORDER: Record<Tone, string> = {
  brand: "border-pink-200 focus-visible:border-brand",
  ingredient: "border-amber-200 focus-visible:border-ingredient",
  data: "border-blue-200 focus-visible:border-data",
  danger: "border-red-200 focus-visible:border-danger",
  neutral: "border-gray-200 focus-visible:border-gray-400",
};

export function SearchBar({ value, onChange, placeholder, tone = "neutral" }: SearchBarProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <input
      type="search"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      aria-label={placeholder ?? "검색"}
      className={`w-full rounded-2xl border bg-white px-5 py-3.5 text-sm shadow-sm outline-none placeholder:text-gray-400 ${TONE_BORDER[tone]}`}
    />
  );
}
