import type { Recipe } from "./entities";
import type { RecipeCategoryId } from "./ids";

export interface RecipeListFilter {
  searchText: string;
  categoryId: RecipeCategoryId | null;
}

export function filterRecipes(recipes: readonly Recipe[], filter: RecipeListFilter): Recipe[] {
  const normalizedSearchText = filter.searchText.trim().toLowerCase();

  return recipes.filter((recipe) => {
    const matchesSearchText =
      normalizedSearchText === "" || recipe.name.toLowerCase().includes(normalizedSearchText);
    const matchesCategory = filter.categoryId === null || recipe.categoryId === filter.categoryId;
    return matchesSearchText && matchesCategory;
  });
}
