import { z } from "zod";
import type { RecipeId } from "./ids";
import type { PositiveNumber } from "./numbers";

export const checklistFormInputSchema = z.object({
  recipeId: z
    .string()
    .min(1)
    .transform((v) => v as RecipeId),
  date: z.string().min(1),
  batchSize: z
    .number()
    .gt(0)
    .transform((n) => n as PositiveNumber),
});

export type ChecklistFormInput = z.infer<typeof checklistFormInputSchema>;
