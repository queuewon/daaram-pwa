import { describe, expect, it } from "vitest";
import { scaleBatch } from "./batch";
import { parseNonNegativeNumber, parsePositiveNumber } from "./numbers";
import type { IngredientId } from "./ids";

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
