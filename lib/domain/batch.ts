import type { IngredientId } from "./ids";
import type { PositiveNumber } from "./numbers";
import type { RecipeSnapshotLine } from "./recipeSnapshot";

export interface ScaleBatchInput {
  baseYieldGram: PositiveNumber;
  targetYieldGram: PositiveNumber;
  lines: readonly RecipeSnapshotLine[];
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
