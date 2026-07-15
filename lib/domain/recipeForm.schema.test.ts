import { describe, expect, it } from "vitest";
import { recipeFormInputSchema } from "./recipeForm.schema";
import type { IngredientId, RecipeCategoryId } from "./ids";

function validInput() {
  return {
    name: "피스타치오 젤라또",
    categoryIds: [] as RecipeCategoryId[],
    memo: "",
    lines: [
      { ingredientId: "ingredient-a" as IngredientId, quantityGram: 100 },
      { ingredientId: "ingredient-b" as IngredientId, quantityGram: 50 },
    ],
  };
}

describe("recipeFormInputSchema — happy path", () => {
  it("정상 입력을 통과시킨다", () => {
    const result = recipeFormInputSchema.safeParse(validInput());

    expect(result.success).toBe(true);
  });

  it("categoryIds 배열이 통과한다", () => {
    const result = recipeFormInputSchema.safeParse({
      ...validInput(),
      categoryIds: ["cat-1"] as RecipeCategoryId[],
    });

    expect(result.success).toBe(true);
  });
});

describe("recipeFormInputSchema — 검증 실패", () => {
  it("name이 빈 문자열이면 거부한다", () => {
    const result = recipeFormInputSchema.safeParse({ ...validInput(), name: "" });

    expect(result.success).toBe(false);
  });

  it("재료가 없으면(총량 0) 거부한다", () => {
    const result = recipeFormInputSchema.safeParse({ ...validInput(), lines: [] });

    expect(result.success).toBe(false);
  });

  it("재료 사용량이 전부 0g이면(총량 0) 거부한다", () => {
    const result = recipeFormInputSchema.safeParse({
      ...validInput(),
      lines: [{ ingredientId: "ingredient-a" as IngredientId, quantityGram: 0 }],
    });

    expect(result.success).toBe(false);
  });

  it("quantityGram이 음수면 거부한다", () => {
    const result = recipeFormInputSchema.safeParse({
      ...validInput(),
      lines: [{ ingredientId: "ingredient-a" as IngredientId, quantityGram: -1 }],
    });

    expect(result.success).toBe(false);
  });

  it("같은 ingredientId가 lines에 중복되면 거부한다", () => {
    const result = recipeFormInputSchema.safeParse({
      ...validInput(),
      lines: [
        { ingredientId: "ingredient-a" as IngredientId, quantityGram: 100 },
        { ingredientId: "ingredient-a" as IngredientId, quantityGram: 50 },
      ],
    });

    expect(result.success).toBe(false);
  });
});
