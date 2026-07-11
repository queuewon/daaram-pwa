import { createLabelStore } from "./createLabelStore";
import {
  ingredientCategoryRepository,
  packageUnitRepository,
  recipeCategoryRepository,
} from "../lib/infra/repositories";
import { generateId } from "../lib/domain/ids";
import type { IngredientCategory, PackageUnit, RecipeCategory } from "../lib/domain/entities";
import type { IngredientCategoryId, PackageUnitId, RecipeCategoryId } from "../lib/domain/ids";

export const useRecipeCategoryStore = createLabelStore<RecipeCategory, RecipeCategoryId>(
  recipeCategoryRepository,
  () => generateId<"RecipeCategoryId">(),
);

export const useIngredientCategoryStore = createLabelStore<
  IngredientCategory,
  IngredientCategoryId
>(ingredientCategoryRepository, () => generateId<"IngredientCategoryId">());

export const usePackageUnitStore = createLabelStore<PackageUnit, PackageUnitId>(
  packageUnitRepository,
  () => generateId<"PackageUnitId">(),
);
