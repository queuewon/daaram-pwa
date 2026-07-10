import { create } from "zustand";
import { db } from "../lib/infra/db";
import type { Ingredient } from "../lib/domain/entities";

interface IngredientStoreState {
  ingredients: Ingredient[];
  loadIngredients: () => Promise<void>;
  addIngredient: (ingredient: Ingredient) => Promise<void>;
}

export const useIngredientStore = create<IngredientStoreState>((set) => ({
  ingredients: [],
  loadIngredients: async () => {
    const ingredients = await db.ingredients.toArray();
    set({ ingredients });
  },
  addIngredient: async (ingredient) => {
    await db.ingredients.add(ingredient);
    set((state) => ({ ingredients: [...state.ingredients, ingredient] }));
  },
}));
