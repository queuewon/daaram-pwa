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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {CATEGORY_COLOR_PRESETS.map((presetHex) => {
          const selected = hexEquals(value, presetHex);
          return (
            <button
              key={presetHex}
              type="button"
              aria-label={`색상 ${presetHex} 선택`}
              aria-pressed={selected}
              onClick={() => onChange(presetHex)}
              className={`h-10 w-10 shrink-0 rounded-full border-2 border-white shadow-sm outline-none ${
                selected ? "ring-2 ring-gray-900 ring-offset-2" : ""
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
          className={`h-10 w-10 shrink-0 rounded-full border-2 border-white p-0 shadow-sm ${
            isCustom ? "ring-2 ring-gray-900 ring-offset-2" : ""
          }`}
        />
      </div>

      <input
        type="text"
        aria-label="색상 hex 직접 입력"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#RRGGBB"
        className="w-32"
      />
    </div>
  );
}
