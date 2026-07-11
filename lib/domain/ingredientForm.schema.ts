import { z } from "zod";
import type { IngredientCategoryId, SupplierId } from "./ids";
import type { NonNegativeNumber, PositiveNumber } from "./numbers";

export const ingredientFormInputSchema = z.object({
  name: z.string().min(1),
  categoryId: z
    .string()
    .min(1)
    .transform((v) => v as IngredientCategoryId)
    .nullable(),
  supplierId: z
    .string()
    .min(1)
    .transform((v) => v as SupplierId)
    .nullable(),
  packagePrice: z
    .number()
    .min(0)
    .transform((n) => n as NonNegativeNumber),
  packageAmount: z
    .number()
    .gt(0)
    .transform((n) => n as PositiveNumber),
  stockCount: z
    .number()
    .min(0)
    .transform((n) => n as NonNegativeNumber),
  stockUnit: z.string().min(1),
});

export type IngredientFormInput = z.infer<typeof ingredientFormInputSchema>;
