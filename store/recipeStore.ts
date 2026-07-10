import { create } from "zustand";
import { recipeRepository } from "../lib/infra/repositories";
import type { Recipe } from "../lib/domain/entities";

interface RecipeStoreState {
  recipes: Recipe[];
  loadRecipes: () => Promise<void>;
  addRecipe: (recipe: Recipe) => Promise<void>;
}

export const useRecipeStore = create<RecipeStoreState>((set) => ({
  recipes: [],
  loadRecipes: async () => {
    const result = await recipeRepository.list();
    if (result.ok) set({ recipes: result.value.items });
  },
  addRecipe: async (recipe) => {
    await recipeRepository.create(recipe);
    set((state) => ({ recipes: [...state.recipes, recipe] }));
  },
}));
