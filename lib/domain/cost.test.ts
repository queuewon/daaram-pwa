import { describe, expect, it } from "vitest";
import { calculateRecipeCost } from "./cost";
import { parseNonNegativeNumber } from "./numbers";
import type { IngredientId } from "./ids";

function nn(n: number) {
  const result = parseNonNegativeNumber(n);
  if (!result.ok) throw new Error("test setup: invalid NonNegativeNumber");
  return result.value;
}

const ingredientA = "ingredient-a" as IngredientId;
const ingredientB = "ingredient-b" as IngredientId;

describe("calculateRecipeCost", () => {
  it("여러 라인의 원가를 정확히 합산한다", () => {
    const result = calculateRecipeCost([
      { ingredientId: ingredientA, quantityGram: nn(100), unitPriceKrwPerGram: 10 },
      { ingredientId: ingredientB, quantityGram: nn(50), unitPriceKrwPerGram: 20 },
    ]);

    expect(result.totalCostKrw).toBe(2000);
    expect(result.perLineCostKrw).toEqual([
      { ingredientId: ingredientA, costKrw: 1000 },
      { ingredientId: ingredientB, costKrw: 1000 },
    ]);
  });

  it("빈 입력이면 합계는 0이다", () => {
    const result = calculateRecipeCost([]);

    expect(result.totalCostKrw).toBe(0);
    expect(result.perLineCostKrw).toEqual([]);
  });

  it("quantityGram이 0인 라인의 원가는 0이다", () => {
    const result = calculateRecipeCost([
      { ingredientId: ingredientA, quantityGram: nn(0), unitPriceKrwPerGram: 10 },
    ]);

    expect(result.totalCostKrw).toBe(0);
    expect(result.perLineCostKrw).toEqual([{ ingredientId: ingredientA, costKrw: 0 }]);
  });
});
