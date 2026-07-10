import { z } from "zod";
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
import type { NonNegativeNumber, PositiveNumber } from "../domain/numbers";

const nonNegativeNumberSchema = z
  .number()
  .min(0)
  .transform((n) => n as NonNegativeNumber);

const positiveNumberSchema = z
  .number()
  .gt(0)
  .transform((n) => n as PositiveNumber);

export const recipeCategorySchema = z.object({
  id: z
    .string()
    .min(1)
    .transform((v) => v as RecipeCategoryId),
  label: z.string().min(1),
});

export const ingredientCategorySchema = z.object({
  id: z
    .string()
    .min(1)
    .transform((v) => v as IngredientCategoryId),
  label: z.string().min(1),
});

export const packageUnitSchema = z.object({
  id: z
    .string()
    .min(1)
    .transform((v) => v as PackageUnitId),
  label: z.string().min(1),
  gramsPerUnit: positiveNumberSchema,
});

export const supplierSchema = z.object({
  id: z
    .string()
    .min(1)
    .transform((v) => v as SupplierId),
  name: z.string().min(1),
});

export const ingredientSchema = z.object({
  id: z
    .string()
    .min(1)
    .transform((v) => v as IngredientId),
  name: z.string().min(1),
  categoryId: z
    .string()
    .min(1)
    .transform((v) => v as IngredientCategoryId)
    .nullable(),
  supplierId: z
    .string()
    .min(1)
    .transform((v) => v as SupplierId)
    .nullable(),
  packageUnitId: z
    .string()
    .min(1)
    .transform((v) => v as PackageUnitId)
    .nullable(),
  currentPriceKrwPerGram: nonNegativeNumberSchema,
});

export const ingredientPriceHistorySchema = z.object({
  id: z
    .string()
    .min(1)
    .transform((v) => v as IngredientPriceHistoryId),
  ingredientId: z
    .string()
    .min(1)
    .transform((v) => v as IngredientId),
  priceKrwPerGram: nonNegativeNumberSchema,
  recordedAt: z.string().min(1),
});

export const recipeSchema = z.object({
  id: z
    .string()
    .min(1)
    .transform((v) => v as RecipeId),
  name: z.string().min(1),
  categoryId: z
    .string()
    .min(1)
    .transform((v) => v as RecipeCategoryId)
    .nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const recipeVersionLineSchema = z.object({
  ingredientId: z
    .string()
    .min(1)
    .transform((v) => v as IngredientId),
  quantityGram: nonNegativeNumberSchema,
});

export const recipeVersionSchema = z.object({
  id: z
    .string()
    .min(1)
    .transform((v) => v as RecipeVersionId),
  recipeId: z
    .string()
    .min(1)
    .transform((v) => v as RecipeId),
  versionNo: z.number().int().min(1),
  yieldGram: positiveNumberSchema,
  lines: z.array(recipeVersionLineSchema),
  createdAt: z.string().min(1),
});

export const dailyChecklistSchema = z.object({
  id: z
    .string()
    .min(1)
    .transform((v) => v as DailyChecklistId),
  date: z.string().min(1),
  note: z.string(),
  isDone: z.boolean(),
});

export const backupFileSchema = z.object({
  schemaVersion: z.literal(1),
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
