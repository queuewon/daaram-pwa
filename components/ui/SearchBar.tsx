import type { ChangeEvent } from "react";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
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
      className="w-full rounded-full border border-gray-300 px-4 py-2"
    />
  );
}
