import { z } from "zod";
import { totalBatchGram } from "./batch";
import type { IngredientId, RecipeCategoryId } from "./ids";
import type { NonNegativeNumber } from "./numbers";

export const recipeFormInputSchema = z
  .object({
    name: z.string().min(1),
    categoryIds: z
      .array(
        z
          .string()
          .min(1)
          .transform((v) => v as RecipeCategoryId),
      )
      .default([]),
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
  })
  // 기본 배치량은 재료 합으로 파생되므로, 총량이 0보다 커야 저장 가능하다.
  .refine((v) => totalBatchGram(v.lines) > 0, {
    message: "재료를 1개 이상 넣어 총량이 0보다 커야 합니다",
    path: ["lines"],
  });

export type RecipeFormInput = z.infer<typeof recipeFormInputSchema>;
