declare const brand: unique symbol;
export type Branded<T, B extends string> = T & { readonly [brand]: B };

export type RecipeId = Branded<string, "RecipeId">;
export type RecipeVersionId = Branded<string, "RecipeVersionId">;
export type IngredientId = Branded<string, "IngredientId">;
export type IngredientPriceHistoryId = Branded<string, "IngredientPriceHistoryId">;
export type SupplierId = Branded<string, "SupplierId">;
export type DailyChecklistId = Branded<string, "DailyChecklistId">;
export type RecipeCategoryId = Branded<string, "RecipeCategoryId">;
export type IngredientCategoryId = Branded<string, "IngredientCategoryId">;
export type PackageUnitId = Branded<string, "PackageUnitId">;
