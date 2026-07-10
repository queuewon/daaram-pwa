import type { IngredientId } from "./ids";
import type { NonNegativeNumber, PositiveNumber } from "./numbers";

export interface ScaleBatchLine {
  ingredientId: IngredientId;
  quantityGram: NonNegativeNumber;
}

export interface ScaleBatchInput {
  baseYieldGram: PositiveNumber;
  targetYieldGram: PositiveNumber;
  lines: readonly ScaleBatchLine[];
}

export interface ScaledLine {
  ingredientId: IngredientId;
  scaledQuantityGram: number;
}

export function scaleBatch(input: ScaleBatchInput): readonly ScaledLine[] {
  const ratio = input.targetYieldGram / input.baseYieldGram;

  return input.lines.map((line) => ({
    ingredientId: line.ingredientId,
    scaledQuantityGram: line.quantityGram * ratio,
  }));
}
