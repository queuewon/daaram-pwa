import { describe, expect, it } from "vitest";
import { checklistFormInputSchema } from "./checklistForm.schema";
import type { RecipeId } from "./ids";

function validInput() {
  return { recipeId: "recipe-1" as RecipeId, date: "2026-07-11", batchSize: 1000 };
}

describe("checklistFormInputSchema — happy path", () => {
  it("정상 입력을 통과시킨다", () => {
    expect(checklistFormInputSchema.safeParse(validInput()).success).toBe(true);
  });
});

describe("checklistFormInputSchema — 검증 실패", () => {
  it("recipeId가 빈 문자열이면 거부한다", () => {
    expect(checklistFormInputSchema.safeParse({ ...validInput(), recipeId: "" }).success).toBe(
      false,
    );
  });

  it("date가 빈 문자열이면 거부한다", () => {
    expect(checklistFormInputSchema.safeParse({ ...validInput(), date: "" }).success).toBe(false);
  });

  it("batchSize가 0이면 거부한다", () => {
    expect(checklistFormInputSchema.safeParse({ ...validInput(), batchSize: 0 }).success).toBe(
      false,
    );
  });

  it("batchSize가 음수면 거부한다", () => {
    expect(checklistFormInputSchema.safeParse({ ...validInput(), batchSize: -1 }).success).toBe(
      false,
    );
  });
});
