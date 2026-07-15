import { describe, expect, it } from "vitest";
import { scaleBatch, stepBatchSize, totalBatchGram } from "./batch";
import { parseNonNegativeNumber, parsePositiveNumber } from "./numbers";
import type { IngredientId } from "./ids";

describe("totalBatchGram", () => {
  it("재료 사용량의 합을 반환한다", () => {
    expect(totalBatchGram([{ quantityGram: 100 }, { quantityGram: 50 }])).toBe(150);
  });

  it("빈 배열이면 0", () => {
    expect(totalBatchGram([])).toBe(0);
  });

  it("단일 재료면 그 값", () => {
    expect(totalBatchGram([{ quantityGram: 250 }])).toBe(250);
  });
});

function nn(n: number) {
  const result = parseNonNegativeNumber(n);
  if (!result.ok) throw new Error("test setup: invalid NonNegativeNumber");
  return result.value;
}

function pos(n: number) {
  const result = parsePositiveNumber(n);
  if (!result.ok) throw new Error("test setup: invalid PositiveNumber");
  return result.value;
}

const ingredientA = "ingredient-a" as IngredientId;
const ingredientB = "ingredient-b" as IngredientId;

describe("scaleBatch", () => {
  it("목표 생산량이 기준의 2배면 모든 라인 수량이 2배가 된다", () => {
    const result = scaleBatch({
      baseYieldGram: pos(1000),
      targetYieldGram: pos(2000),
      lines: [
        { ingredientId: ingredientA, quantityGram: nn(100) },
        { ingredientId: ingredientB, quantityGram: nn(50) },
      ],
    });

    expect(result).toEqual([
      { ingredientId: ingredientA, scaledQuantityGram: 200 },
      { ingredientId: ingredientB, scaledQuantityGram: 100 },
    ]);
  });

  it("빈 라인이면 빈 배열을 반환한다", () => {
    const result = scaleBatch({
      baseYieldGram: pos(1000),
      targetYieldGram: pos(500),
      lines: [],
    });

    expect(result).toEqual([]);
  });

  it("목표 생산량이 기준과 같으면 수량이 그대로다", () => {
    const result = scaleBatch({
      baseYieldGram: pos(1000),
      targetYieldGram: pos(1000),
      lines: [{ ingredientId: ingredientA, quantityGram: nn(100) }],
    });

    expect(result).toEqual([{ ingredientId: ingredientA, scaledQuantityGram: 100 }]);
  });
});

describe("stepBatchSize", () => {
  it("500g 단위로 증가한다", () => {
    expect(stepBatchSize(5000, 500)).toBe(5500);
  });

  it("500g 단위로 감소한다", () => {
    expect(stepBatchSize(5000, -500)).toBe(4500);
  });

  it("하한(500g)에서 더 감소시키려 해도 500g에 머문다", () => {
    expect(stepBatchSize(500, -500)).toBe(500);
  });

  it("500g 배수가 아닌 값에서 감소시키면 하한 500g으로 스냅한다", () => {
    expect(stepBatchSize(734, -500)).toBe(500);
  });
});
