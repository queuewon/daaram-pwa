"use client";

import { CATEGORY_COLOR_PRESETS } from "@/lib/domain/labelColor";

interface ColorSwatchPickerProps {
  value: string;
  onChange: (colorHex: string) => void;
}

function hexEquals(value: string, presetHex: string): boolean {
  return value.toLowerCase() === presetHex.toLowerCase();
}

export function ColorSwatchPicker({ value, onChange }: ColorSwatchPickerProps) {
  const isCustom = !CATEGORY_COLOR_PRESETS.some((preset) => hexEquals(value, preset));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {CATEGORY_COLOR_PRESETS.map((presetHex) => {
        const selected = hexEquals(value, presetHex);
        return (
          <button
            key={presetHex}
            type="button"
            aria-label={`색상 ${presetHex} 선택`}
            aria-pressed={selected}
            onClick={() => onChange(presetHex)}
            className={`h-8 w-8 shrink-0 rounded-full border-2 ${
              selected ? "border-gray-900" : "border-transparent"
            }`}
            style={{ backgroundColor: presetHex }}
          />
        );
      })}

      <input
        type="color"
        aria-label="직접 선택"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 w-8 shrink-0 rounded-full border-2 p-0 ${
          isCustom ? "border-gray-900" : "border-transparent"
        }`}
      />
      <input
        type="text"
        aria-label="색상 hex 직접 입력"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#RRGGBB"
        className="w-28"
      />
    </div>
  );
}
