import { z } from "zod";
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

export const BACKUP_SCHEMA_VERSION = 2;

export const backupFileSchema = z.object({
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: z.string().min(1),
  data: z.object({
    recipes: z.array(recipeSchema),
    recipe_versions: z.array(recipeVersionSchema),
    ingredients: z.array(ingredientSchema),
    ingredient_price_history: z.array(ingredientPriceHistorySchema),
    suppliers: z.array(supplierSchema),
    daily_checklist: z.array(dailyChecklistSchema),
    recipe_categories: z.array(recipeCategorySchema),
    ingredient_categories: z.array(ingredientCategorySchema),
    package_units: z.array(packageUnitSchema),
  }),
});

export type BackupFile = z.infer<typeof backupFileSchema>;

export const BACKUP_TABLE_NAMES = [
  "recipes",
  "recipe_versions",
  "ingredients",
  "ingredient_price_history",
  "suppliers",
  "daily_checklist",
  "recipe_categories",
  "ingredient_categories",
  "package_units",
] as const;
