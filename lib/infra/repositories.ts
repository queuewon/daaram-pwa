import {
  dailyChecklistSchema,
  ingredientCategorySchema,
  ingredientPriceHistorySchema,
  ingredientSchema,
  packageUnitSchema,
  recipeCategorySchema,
  recipeSchema,
  recipeVersionSchema,
  supplierSchema,
} from "../domain/entities.schema";
import type {
  DailyChecklist,
  Ingredient,
  IngredientCategory,
  IngredientPriceHistory,
  PackageUnit,
  Recipe,
  RecipeCategory,
  RecipeVersion,
  Supplier,
} from "../domain/entities";
import type {
  DailyChecklistId,
  IngredientCategoryId,
  IngredientId,
  IngredientPriceHistoryId,
  PackageUnitId,
  RecipeCategoryId,
  RecipeId,
  RecipeVersionId,
  SupplierId,
} from "../domain/ids";
import { ok, type Result } from "../domain/result";
import { db } from "./db";
import { createRepository } from "./repository";

export const recipeRepository = createRepository<Recipe, RecipeId>(db.recipes, recipeSchema);
export const ingredientRepository = createRepository<Ingredient, IngredientId>(
  db.ingredients,
  ingredientSchema,
);
export const checklistRepository = createRepository<DailyChecklist, DailyChecklistId>(
  db.daily_checklist,
  dailyChecklistSchema,
);
export const recipeVersionRepository = createRepository<RecipeVersion, RecipeVersionId>(
  db.recipe_versions,
  recipeVersionSchema,
);
export const supplierRepository = createRepository<Supplier, SupplierId>(
  db.suppliers,
  supplierSchema,
);
export const ingredientPriceHistoryRepository = createRepository<
  IngredientPriceHistory,
  IngredientPriceHistoryId
>(db.ingredient_price_history, ingredientPriceHistorySchema);
export const recipeCategoryRepository = createRepository<RecipeCategory, RecipeCategoryId>(
  db.recipe_categories,
  recipeCategorySchema,
);
export const ingredientCategoryRepository = createRepository<
  IngredientCategory,
  IngredientCategoryId
>(db.ingredient_categories, ingredientCategorySchema);
export const packageUnitRepository = createRepository<PackageUnit, PackageUnitId>(
  db.package_units,
  packageUnitSchema,
);

export async function listRecipeVersionsByRecipeId(
  recipeId: RecipeId,
): Promise<Result<RecipeVersion[], never>> {
  const rows = await db.recipe_versions.where("recipeId").equals(recipeId).toArray();
  const items: RecipeVersion[] = [];

  for (const row of rows) {
    const parsed = recipeVersionSchema.safeParse(row);
    if (parsed.success) items.push(parsed.data);
  }

  items.sort((a, b) => b.versionNo - a.versionNo);
  return ok(items);
}

export async function listIngredientPriceHistoryByIngredientId(
  ingredientId: IngredientId,
): Promise<Result<IngredientPriceHistory[], never>> {
  const rows = await db.ingredient_price_history
    .where("ingredientId")
    .equals(ingredientId)
    .toArray();
  const items: IngredientPriceHistory[] = [];

  for (const row of rows) {
    const parsed = ingredientPriceHistorySchema.safeParse(row);
    if (parsed.success) items.push(parsed.data);
  }

  items.sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : a.recordedAt > b.recordedAt ? -1 : 0));
  return ok(items);
}
