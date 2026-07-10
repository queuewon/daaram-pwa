import type { IngredientId } from "./ids";
import type { RecipeSnapshotLine } from "./recipeSnapshot";

export interface CostLineItem extends RecipeSnapshotLine {
  unitPriceKrwPerGram: number;
}

export interface RecipeCostResult {
  totalCostKrw: number;
  perLineCostKrw: ReadonlyArray<{ ingredientId: IngredientId; costKrw: number }>;
}

export function calculateRecipeCost(lines: readonly CostLineItem[]): RecipeCostResult {
  const perLineCostKrw = lines.map((line) => ({
    ingredientId: line.ingredientId,
    costKrw: line.quantityGram * line.unitPriceKrwPerGram,
  }));

  const totalCostKrw = perLineCostKrw.reduce((sum, line) => sum + line.costKrw, 0);

  return { totalCostKrw, perLineCostKrw };
}
