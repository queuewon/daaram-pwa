import { create } from "zustand";
import { ingredientRepository } from "../lib/infra/repositories";
import type { Ingredient } from "../lib/domain/entities";

interface IngredientStoreState {
  ingredients: Ingredient[];
  loadIngredients: () => Promise<void>;
  addIngredient: (ingredient: Ingredient) => Promise<void>;
}

export const useIngredientStore = create<IngredientStoreState>((set) => ({
  ingredients: [],
  loadIngredients: async () => {
    const result = await ingredientRepository.list();
    if (result.ok) set({ ingredients: result.value.items });
  },
  addIngredient: async (ingredient) => {
    await ingredientRepository.create(ingredient);
    set((state) => ({ ingredients: [...state.ingredients, ingredient] }));
  },
}));
