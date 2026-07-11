import { create } from "zustand";
import type { z } from "zod";
import {
  listRecipeVersionsByRecipeId,
  recipeRepository,
  recipeVersionRepository,
} from "../lib/infra/repositories";
import { recipeFormInputSchema } from "../lib/domain/recipeForm.schema";
import { buildRecipeVersion, nextVersionNo } from "../lib/domain/recipeVersion";
import { generateId } from "../lib/domain/ids";
import { err, ok, type Result } from "../lib/domain/result";
import type { Recipe, RecipeVersion } from "../lib/domain/entities";
import type { RecipeId } from "../lib/domain/ids";

export type SaveRecipeError =
  | { type: "InvalidForm"; issues: z.core.$ZodIssue[] }
  | { type: "NotFound"; id: string }
  | { type: "CorruptedRecord"; id: string; issues: z.core.$ZodIssue[] };

export interface SaveRecipeInput {
  recipeId: RecipeId | null;
  form: unknown;
}

interface RecipeStoreState {
  recipes: Recipe[];
  versions: RecipeVersion[];
  loadRecipes: () => Promise<void>;
  loadVersions: (recipeId: RecipeId) => Promise<void>;
  saveRecipe: (input: SaveRecipeInput) => Promise<Result<Recipe, SaveRecipeError>>;
  removeRecipe: (id: RecipeId) => Promise<void>;
}

export const useRecipeStore = create<RecipeStoreState>((set) => ({
  recipes: [],
  versions: [],

  loadRecipes: async () => {
    const result = await recipeRepository.list();
    if (result.ok) set({ recipes: result.value.items });
  },

  loadVersions: async (recipeId) => {
    const result = await listRecipeVersionsByRecipeId(recipeId);
    if (result.ok) set({ versions: result.value });
  },

  saveRecipe: async ({ recipeId, form }) => {
    const parsed = recipeFormInputSchema.safeParse(form);
    if (!parsed.success) {
      return err({ type: "InvalidForm", issues: parsed.error.issues });
    }

    const now = new Date().toISOString();
    const snapshot = { batchSize: parsed.data.batchSize, lines: parsed.data.lines };

    if (recipeId === null) {
      const recipe: Recipe = {
        id: generateId<"RecipeId">(),
        name: parsed.data.name,
        categoryId: parsed.data.categoryId,
        batchSize: parsed.data.batchSize,
        memo: parsed.data.memo,
        createdAt: now,
        updatedAt: now,
      };
      await recipeRepository.create(recipe);

      const version = buildRecipeVersion({
        id: generateId<"RecipeVersionId">(),
        recipeId: recipe.id,
        versionNo: nextVersionNo([]),
        snapshot,
        createdAt: now,
      });
      await recipeVersionRepository.create(version);

      set((state) => ({ recipes: [...state.recipes, recipe], versions: [version] }));
      return ok(recipe);
    }

    const existingResult = await recipeRepository.get(recipeId);
    if (!existingResult.ok) return err(existingResult.error);
    if (existingResult.value === null) {
      return err({ type: "NotFound", id: recipeId });
    }

    const updatedRecipe: Recipe = {
      ...existingResult.value,
      name: parsed.data.name,
      categoryId: parsed.data.categoryId,
      batchSize: parsed.data.batchSize,
      memo: parsed.data.memo,
      updatedAt: now,
    };
    const updateResult = await recipeRepository.update(updatedRecipe);
    if (!updateResult.ok) {
      return err({ type: "NotFound", id: recipeId });
    }

    const existingVersionsResult = await listRecipeVersionsByRecipeId(recipeId);
    const existingVersions = existingVersionsResult.ok ? existingVersionsResult.value : [];

    const version = buildRecipeVersion({
      id: generateId<"RecipeVersionId">(),
      recipeId,
      versionNo: nextVersionNo(existingVersions.map((v) => v.versionNo)),
      snapshot,
      createdAt: now,
    });
    await recipeVersionRepository.create(version);

    set((state) => ({
      recipes: state.recipes.map((r) => (r.id === recipeId ? updatedRecipe : r)),
      versions: [version, ...existingVersions],
    }));
    return ok(updatedRecipe);
  },

  removeRecipe: async (id) => {
    await recipeRepository.remove(id);
    set((state) => ({ recipes: state.recipes.filter((r) => r.id !== id) }));
  },
}));
