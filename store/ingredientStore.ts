import { create } from "zustand";
import type { z } from "zod";
import {
  ingredientPriceHistoryRepository,
  ingredientRepository,
  listIngredientPriceHistoryByIngredientId,
} from "../lib/infra/repositories";
import { ingredientFormInputSchema } from "../lib/domain/ingredientForm.schema";
import { computePricePerGram, hasPackagePriceChanged } from "../lib/domain/ingredientPricing";
import { createIngredient } from "../lib/domain/entities.schema";
import { generateId } from "../lib/domain/ids";
import { err, ok, type Result } from "../lib/domain/result";
import type { Ingredient, IngredientPriceHistory } from "../lib/domain/entities";
import type { IngredientId } from "../lib/domain/ids";

export type SaveIngredientError =
  | { type: "InvalidForm"; issues: z.core.$ZodIssue[] }
  | { type: "NotFound"; id: string }
  | { type: "CorruptedRecord"; id: string; issues: z.core.$ZodIssue[] }
  | { type: "OutOfRange"; value: number };

export interface SaveIngredientInput {
  ingredientId: IngredientId | null;
  form: unknown;
}

interface IngredientStoreState {
  ingredients: Ingredient[];
  priceHistory: IngredientPriceHistory[];
  loadIngredients: () => Promise<void>;
  loadPriceHistory: (ingredientId: IngredientId) => Promise<void>;
  saveIngredient: (input: SaveIngredientInput) => Promise<Result<Ingredient, SaveIngredientError>>;
  removeIngredient: (id: IngredientId) => Promise<void>;
}

export const useIngredientStore = create<IngredientStoreState>((set) => ({
  ingredients: [],
  priceHistory: [],

  loadIngredients: async () => {
    const result = await ingredientRepository.list();
    if (result.ok) set({ ingredients: result.value.items });
  },

  loadPriceHistory: async (ingredientId) => {
    const result = await listIngredientPriceHistoryByIngredientId(ingredientId);
    if (result.ok) set({ priceHistory: result.value });
  },

  saveIngredient: async ({ ingredientId, form }) => {
    const parsed = ingredientFormInputSchema.safeParse(form);
    if (!parsed.success) {
      return err({ type: "InvalidForm", issues: parsed.error.issues });
    }

    const now = new Date().toISOString();

    if (ingredientId === null) {
      const createdResult = createIngredient({
        id: generateId<"IngredientId">(),
        name: parsed.data.name,
        categoryId: null,
        supplierId: parsed.data.supplierId,
        packagePrice: parsed.data.packagePrice,
        packageAmount: parsed.data.packageAmount,
        stockCount: parsed.data.stockCount,
        stockUnit: parsed.data.stockUnit,
      });
      if (!createdResult.ok) {
        return err({ type: "OutOfRange", value: createdResult.error.value });
      }
      const ingredient = createdResult.value;
      await ingredientRepository.create(ingredient);

      const historyEntry: IngredientPriceHistory = {
        id: generateId<"IngredientPriceHistoryId">(),
        ingredientId: ingredient.id,
        packagePrice: parsed.data.packagePrice,
        packageAmount: parsed.data.packageAmount,
        recordedAt: now,
      };
      await ingredientPriceHistoryRepository.create(historyEntry);

      set((state) => ({
        ingredients: [...state.ingredients, ingredient],
        priceHistory: [historyEntry],
      }));
      return ok(ingredient);
    }

    const existingResult = await ingredientRepository.get(ingredientId);
    if (!existingResult.ok) return err(existingResult.error);
    if (existingResult.value === null) {
      return err({ type: "NotFound", id: ingredientId });
    }
    const existing = existingResult.value;

    const pricePerGramResult = computePricePerGram(
      parsed.data.packagePrice,
      parsed.data.packageAmount,
    );
    if (!pricePerGramResult.ok) {
      return err({ type: "OutOfRange", value: pricePerGramResult.error.value });
    }

    const updatedIngredient: Ingredient = {
      ...existing,
      name: parsed.data.name,
      supplierId: parsed.data.supplierId,
      packagePrice: parsed.data.packagePrice,
      packageAmount: parsed.data.packageAmount,
      pricePerGram: pricePerGramResult.value,
      stockCount: parsed.data.stockCount,
      stockUnit: parsed.data.stockUnit,
    };
    const updateResult = await ingredientRepository.update(updatedIngredient);
    if (!updateResult.ok) {
      return err({ type: "NotFound", id: ingredientId });
    }

    if (hasPackagePriceChanged(existing, parsed.data)) {
      const historyEntry: IngredientPriceHistory = {
        id: generateId<"IngredientPriceHistoryId">(),
        ingredientId,
        packagePrice: parsed.data.packagePrice,
        packageAmount: parsed.data.packageAmount,
        recordedAt: now,
      };
      await ingredientPriceHistoryRepository.create(historyEntry);
      set((state) => ({ priceHistory: [historyEntry, ...state.priceHistory] }));
    }

    set((state) => ({
      ingredients: state.ingredients.map((i) => (i.id === ingredientId ? updatedIngredient : i)),
    }));
    return ok(updatedIngredient);
  },

  removeIngredient: async (id) => {
    await ingredientRepository.remove(id);
    set((state) => ({ ingredients: state.ingredients.filter((i) => i.id !== id) }));
  },
}));
