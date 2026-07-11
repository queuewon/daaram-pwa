import {
  dailyChecklistSchema,
  ingredientSchema,
  recipeSchema,
  recipeVersionSchema,
} from "../domain/entities.schema";
import type { DailyChecklist, Ingredient, Recipe, RecipeVersion } from "../domain/entities";
import type { DailyChecklistId, IngredientId, RecipeId, RecipeVersionId } from "../domain/ids";
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
