import { create } from "zustand";
import { db } from "../lib/infra/db";
import type { Recipe } from "../lib/domain/entities";

interface RecipeStoreState {
  recipes: Recipe[];
  loadRecipes: () => Promise<void>;
  addRecipe: (recipe: Recipe) => Promise<void>;
}

export const useRecipeStore = create<RecipeStoreState>((set) => ({
  recipes: [],
  loadRecipes: async () => {
    const recipes = await db.recipes.toArray();
    set({ recipes });
  },
  addRecipe: async (recipe) => {
    await db.recipes.add(recipe);
    set((state) => ({ recipes: [...state.recipes, recipe] }));
  },
}));
