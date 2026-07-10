import { z } from "zod";
import { err, ok, type Result } from "./result";
import type { IngredientId } from "./ids";
import type { NonNegativeNumber, PositiveNumber } from "./numbers";

export interface RecipeSnapshotLine {
  ingredientId: IngredientId;
  quantityGram: NonNegativeNumber;
}

export interface RecipeSnapshot {
  batchSize: PositiveNumber;
  lines: readonly RecipeSnapshotLine[];
}

export interface InvalidSnapshotError {
  type: "InvalidSnapshot";
  issues: z.core.$ZodIssue[];
}

const recipeSnapshotSchema = z.object({
  batchSize: z
    .number()
    .gt(0)
    .transform((n) => n as PositiveNumber),
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
});

export function serializeRecipeSnapshot(snapshot: RecipeSnapshot): string {
  return JSON.stringify(snapshot);
}

export function parseRecipeSnapshot(json: string): Result<RecipeSnapshot, InvalidSnapshotError> {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    // JSON.parse는 문법 오류 시 SyntaxError를 던진다 — 경계 밖으로 예외를 내보내지 않고 Result로 흡수한다.
    return err({
      type: "InvalidSnapshot",
      issues: [
        {
          code: "custom",
          message: "유효하지 않은 JSON 문자열입니다",
          path: [],
          input: json,
        },
      ],
    });
  }

  const parsed = recipeSnapshotSchema.safeParse(raw);
  return parsed.success
    ? ok(parsed.data)
    : err({ type: "InvalidSnapshot", issues: parsed.error.issues });
}
