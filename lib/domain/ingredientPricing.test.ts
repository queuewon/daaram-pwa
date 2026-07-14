import { describe, expect, it } from "vitest";
import {
  computePriceDeltas,
  computePricePerGram,
  hasPackagePriceChanged,
  stockGrams,
  stockValueKrw,
} from "./ingredientPricing";
import { parseNonNegativeNumber, parsePositiveNumber } from "./numbers";

describe("stockGrams", () => {
  it("재고 수량 × 단위당 중량 = 총 그램", () => {
    expect(stockGrams(nn(5), pos(1000))).toBe(5000);
  });

  it("재고 0이면 0g", () => {
    expect(stockGrams(nn(0), pos(1000))).toBe(0);
  });
});

describe("stockValueKrw", () => {
  it("재고 그램 × 원/g = 재고 가치(원)", () => {
    expect(stockValueKrw(nn(5), pos(1000), nn(2))).toBe(10000);
  });

  it("소수 결과는 원 단위로 반올림한다", () => {
    // 1 * 1 * 0.5 = 0.5 → 1 (반올림), 1 * 1 * 0.4 = 0.4 → 0
    expect(stockValueKrw(nn(1), pos(1), nn(0.5))).toBe(1);
    expect(stockValueKrw(nn(1), pos(1), nn(0.4))).toBe(0);
  });

  it("재고 0이면 0원", () => {
    expect(stockValueKrw(nn(0), pos(1000), nn(2))).toBe(0);
  });
});

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

describe("computePriceDeltas", () => {
  it("항목이 1건이면 first이고 amountKrw는 0이다", () => {
    expect(computePriceDeltas([{ packagePrice: 1000 }])).toEqual([
      { direction: "first", amountKrw: 0 },
    ]);
  });

  it("최신이 이전보다 비싸면 up과 차액을 반환한다", () => {
    expect(computePriceDeltas([{ packagePrice: 1200 }, { packagePrice: 1000 }])).toEqual([
      { direction: "up", amountKrw: 200 },
      { direction: "first", amountKrw: 0 },
    ]);
  });

  it("최신이 이전보다 싸면 down과 차액을 반환한다", () => {
    expect(computePriceDeltas([{ packagePrice: 800 }, { packagePrice: 1000 }])).toEqual([
      { direction: "down", amountKrw: 200 },
      { direction: "first", amountKrw: 0 },
    ]);
  });

  it("가격이 동일하면 flat과 0을 반환한다", () => {
    expect(computePriceDeltas([{ packagePrice: 1000 }, { packagePrice: 1000 }])).toEqual([
      { direction: "flat", amountKrw: 0 },
      { direction: "first", amountKrw: 0 },
    ]);
  });

  it("3건 이상이면 각 항목이 배열상 바로 다음(시간상 직전) 항목과 비교된다", () => {
    expect(
      computePriceDeltas([
        { packagePrice: 1200 }, // vs 1000 → up 200
        { packagePrice: 1000 }, // vs 900 → up 100
        { packagePrice: 900 }, // 최초
      ]),
    ).toEqual([
      { direction: "up", amountKrw: 200 },
      { direction: "up", amountKrw: 100 },
      { direction: "first", amountKrw: 0 },
    ]);
  });

  it("빈 배열이면 빈 배열을 반환한다", () => {
    expect(computePriceDeltas([])).toEqual([]);
  });
});
