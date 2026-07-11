import { z } from "zod";
import type { IngredientId, RecipeCategoryId } from "./ids";
import type { NonNegativeNumber, PositiveNumber } from "./numbers";

export const recipeFormInputSchema = z
  .object({
    name: z.string().min(1),
    categoryId: z
      .string()
      .min(1)
      .transform((v) => v as RecipeCategoryId)
      .nullable(),
    batchSize: z
      .number()
      .gt(0)
      .transform((n) => n as PositiveNumber),
    memo: z.string(),
    lines: z.array(
      z.object({
        ingredientId: z
          .string()
          .min(1)
          .transform((v) => v as IngredientId),
        quantityGram: z
          .number()
          .min(0)
          .transform((n) => n as NonNegativeNumber),
      }),
    ),
  })
  .refine((v) => new Set(v.lines.map((line) => line.ingredientId)).size === v.lines.length, {
    message: "같은 재료를 중복해서 넣을 수 없습니다",
    path: ["lines"],
  });

export type RecipeFormInput = z.infer<typeof recipeFormInputSchema>;
