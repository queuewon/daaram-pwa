import { describe, expect, it } from "vitest";
import { computePricePerGram, hasPackagePriceChanged } from "./ingredientPricing";
import { parseNonNegativeNumber, parsePositiveNumber } from "./numbers";

function nn(n: number) {
  const result = parseNonNegativeNumber(n);
  if (!result.ok) throw new Error("test setup");
  return result.value;
}

function pos(n: number) {
  const result = parsePositiveNumber(n);
  if (!result.ok) throw new Error("test setup");
  return result.value;
}

describe("computePricePerGram", () => {
  it("packagePrice/packageAmount를 정확히 계산한다", () => {
    const result = computePricePerGram(nn(1000), pos(500));

    expect(result).toEqual({ ok: true, value: 2 });
  });

  it("packagePrice가 0이면 0을 반환한다", () => {
    const result = computePricePerGram(nn(0), pos(500));

    expect(result).toEqual({ ok: true, value: 0 });
  });
});

describe("hasPackagePriceChanged", () => {
  it("packagePrice/packageAmount가 둘 다 같으면 false", () => {
    expect(
      hasPackagePriceChanged(
        { packagePrice: 1000, packageAmount: 500 },
        { packagePrice: 1000, packageAmount: 500 },
      ),
    ).toBe(false);
  });

  it("packagePrice만 다르면 true", () => {
    expect(
      hasPackagePriceChanged(
        { packagePrice: 1000, packageAmount: 500 },
        { packagePrice: 1200, packageAmount: 500 },
      ),
    ).toBe(true);
  });

  it("packageAmount만 다르면 true", () => {
    expect(
      hasPackagePriceChanged(
        { packagePrice: 1000, packageAmount: 500 },
        { packagePrice: 1000, packageAmount: 400 },
      ),
    ).toBe(true);
  });

  it("둘 다 다르면 true", () => {
    expect(
      hasPackagePriceChanged(
        { packagePrice: 1000, packageAmount: 500 },
        { packagePrice: 1200, packageAmount: 400 },
      ),
    ).toBe(true);
  });
});
