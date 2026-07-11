import type { IngredientId } from "./ids";
import { parsePositiveNumber, type PositiveNumber } from "./numbers";
import type { RecipeSnapshotLine } from "./recipeSnapshot";

export const MIN_BATCH_GRAM = 500;
export const BATCH_STEP_GRAM = 500;

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

export function stepBatchSize(current: number, deltaGram: number): PositiveNumber {
  const clamped = Math.max(MIN_BATCH_GRAM, current + deltaGram);
  const result = parsePositiveNumber(clamped);
  if (!result.ok) {
    throw new Error("stepBatchSize: clamped value must be positive");
  }
  return result.value;
}
