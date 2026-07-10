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
  label: string;
}

export interface IngredientCategory {
  id: IngredientCategoryId;
  label: string;
}

export interface PackageUnit {
  id: PackageUnitId;
  label: string;
  gramsPerUnit: PositiveNumber;
}

export interface Supplier {
  id: SupplierId;
  name: string;
}

export interface Ingredient {
  id: IngredientId;
  name: string;
  categoryId: IngredientCategoryId | null;
  supplierId: SupplierId | null;
  packageUnitId: PackageUnitId | null;
  currentPriceKrwPerGram: NonNegativeNumber;
}

export interface IngredientPriceHistory {
  id: IngredientPriceHistoryId;
  ingredientId: IngredientId;
  priceKrwPerGram: NonNegativeNumber;
  recordedAt: string;
}

export interface Recipe {
  id: RecipeId;
  name: string;
  categoryId: RecipeCategoryId | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeVersionLine {
  ingredientId: IngredientId;
  quantityGram: NonNegativeNumber;
}

export interface RecipeVersion {
  id: RecipeVersionId;
  recipeId: RecipeId;
  versionNo: number;
  yieldGram: PositiveNumber;
  lines: readonly RecipeVersionLine[];
  createdAt: string;
}

export interface DailyChecklist {
  id: DailyChecklistId;
  date: string;
  note: string;
  isDone: boolean;
}
