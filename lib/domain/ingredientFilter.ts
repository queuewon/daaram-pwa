import type { Ingredient } from "./entities";
import type { IngredientCategoryId } from "./ids";

export interface IngredientListFilter {
  searchText: string;
  categoryId: IngredientCategoryId | null;
}

export function filterIngredients(
  ingredients: readonly Ingredient[],
  filter: IngredientListFilter,
): Ingredient[] {
  const normalizedSearchText = filter.searchText.trim().toLowerCase();

  return ingredients.filter((ingredient) => {
    const matchesSearchText =
      normalizedSearchText === "" || ingredient.name.toLowerCase().includes(normalizedSearchText);
    const matchesCategory =
      filter.categoryId === null || ingredient.categoryId === filter.categoryId;
    return matchesSearchText && matchesCategory;
  });
}
