import { deriveLabelColorScheme } from "@/lib/domain/labelColor";

export interface BadgeProps {
  label: string;
  colorHex: string;
}

const FALLBACK_BACKGROUND = "#f3f4f6";
const FALLBACK_TEXT = "#374151";

export function Badge({ label, colorHex }: BadgeProps) {
  const scheme = deriveLabelColorScheme(colorHex);
  const backgroundHex = scheme.ok ? scheme.value.backgroundHex : FALLBACK_BACKGROUND;
  const textHex = scheme.ok ? scheme.value.textHex : FALLBACK_TEXT;

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: backgroundHex, color: textHex }}
    >
      {label}
    </span>
  );
}
