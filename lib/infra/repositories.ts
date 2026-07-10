import { dailyChecklistSchema, ingredientSchema, recipeSchema } from "../domain/entities.schema";
import type { DailyChecklist, Ingredient, Recipe } from "../domain/entities";
import type { DailyChecklistId, IngredientId, RecipeId } from "../domain/ids";
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
