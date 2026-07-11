import { describe, expect, it } from "vitest";
import { CATEGORY_COLOR_PRESETS, deriveLabelColorScheme } from "./labelColor";

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const lighter = Math.max(relativeLuminance(hexA), relativeLuminance(hexB));
  const darker = Math.min(relativeLuminance(hexA), relativeLuminance(hexB));
  return (lighter + 0.05) / (darker + 0.05);
}

function lightness(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
}

describe("deriveLabelColorScheme", () => {
  it("유효한 hex를 받으면 배경/글자 hex를 산출한다", () => {
    const result = deriveLabelColorScheme("#C2185B");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.backgroundHex).toMatch(/^#[0-9a-f]{6}$/);
    expect(result.value.textHex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("저채도(회색 근접) 색상도 유효한 결과를 산출한다", () => {
    const result = deriveLabelColorScheme("#9ca3af");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.backgroundHex).toMatch(/^#[0-9a-f]{6}$/);
    expect(result.value.textHex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("대소문자와 무관하게 동일한 결과를 산출한다", () => {
    const lower = deriveLabelColorScheme("#c2185b");
    const upper = deriveLabelColorScheme("#C2185B");
    expect(lower).toEqual(upper);
  });

  it("3자리 축약형 hex는 invalid-hex 오류를 반환한다", () => {
    const result = deriveLabelColorScheme("#fff");
    expect(result).toEqual({ ok: false, error: "invalid-hex" });
  });

  it("#이 없는 문자열은 invalid-hex 오류를 반환한다", () => {
    const result = deriveLabelColorScheme("C2185B");
    expect(result).toEqual({ ok: false, error: "invalid-hex" });
  });

  it("빈 문자열은 invalid-hex 오류를 반환한다", () => {
    const result = deriveLabelColorScheme("");
    expect(result).toEqual({ ok: false, error: "invalid-hex" });
  });

  it.each([
    ["red", "#FF0000"],
    ["green", "#16A34A"],
    ["blue", "#2563EB"],
    ["yellow", "#F59E0B"],
    ["purple", "#7C3AED"],
  ])("%s 계열 색상은 배경/글자 대비비가 WCAG AA(4.5:1) 이상이다", (_name, hex) => {
    const result = deriveLabelColorScheme(hex);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ratio = contrastRatio(result.value.backgroundHex, result.value.textHex);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("배경 hex는 원본보다 밝기(lightness)가 높다", () => {
    const original = "#C2185B";
    const result = deriveLabelColorScheme(original);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(lightness(result.value.backgroundHex)).toBeGreaterThan(lightness(original));
  });

  it("글자 hex는 원본보다 밝기(lightness)가 같거나 낮다", () => {
    const original = "#C2185B";
    const result = deriveLabelColorScheme(original);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(lightness(result.value.textHex)).toBeLessThanOrEqual(lightness(original));
  });
});

describe("CATEGORY_COLOR_PRESETS", () => {
  it("정확히 10개의 프리셋을 제공한다", () => {
    expect(CATEGORY_COLOR_PRESETS).toHaveLength(10);
  });

  it("모든 프리셋이 #RRGGBB 형식이다", () => {
    for (const hex of CATEGORY_COLOR_PRESETS) {
      expect(hex).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("스펙에 명시된 10개 hex와 순서까지 정확히 일치한다", () => {
    expect(CATEGORY_COLOR_PRESETS).toEqual([
      "#C2185B",
      "#0369A1",
      "#166534",
      "#854D0E",
      "#6D28D9",
      "#78350F",
      "#B91C1C",
      "#0F766E",
      "#3730A3",
      "#1F2937",
    ]);
  });
});
