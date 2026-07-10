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
} from "./ids";
import type { NonNegativeNumber, PositiveNumber } from "./numbers";

export interface RecipeCategory {
  id: RecipeCategoryId;
  name: string;
  colorHex: string;
}

export interface IngredientCategory {
  id: IngredientCategoryId;
  name: string;
  colorHex: string;
}

export interface PackageUnit {
  id: PackageUnitId;
  name: string;
  colorHex: string;
}

export interface Supplier {
  id: SupplierId;
  name: string;
  contact: string;
  memo: string;
}

export interface Ingredient {
  id: IngredientId;
  name: string;
  categoryId: IngredientCategoryId | null;
  supplierId: SupplierId | null;
  packagePrice: NonNegativeNumber;
  packageAmount: PositiveNumber;
  pricePerGram: NonNegativeNumber;
  stockCount: NonNegativeNumber;
  stockUnit: string;
}

export interface IngredientPriceHistory {
  id: IngredientPriceHistoryId;
  ingredientId: IngredientId;
  packagePrice: NonNegativeNumber;
  packageAmount: PositiveNumber;
  recordedAt: string;
}

export interface Recipe {
  id: RecipeId;
  name: string;
  categoryId: RecipeCategoryId | null;
  batchSize: PositiveNumber;
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeVersion {
  id: RecipeVersionId;
  recipeId: RecipeId;
  versionNo: number;
  snapshotJson: string;
  createdAt: string;
}

export type DailyChecklistStatus = "pending" | "in_progress" | "done";

export interface DailyChecklist {
  id: DailyChecklistId;
  recipeId: RecipeId;
  date: string;
  batchSize: PositiveNumber;
  status: DailyChecklistStatus;
}
