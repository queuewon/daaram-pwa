import { describe, expect, it } from "vitest";
import { ingredientFormInputSchema } from "./ingredientForm.schema";
import type { IngredientCategoryId, SupplierId } from "./ids";

function validInput() {
  return {
    name: "우유",
    categoryIds: [] as IngredientCategoryId[],
    supplierId: null as SupplierId | null,
    packagePrice: 1000,
    packageAmount: 500,
    stockCount: 10,
    stockUnit: "개",
    unitWeightGram: 1,
  };
}

describe("ingredientFormInputSchema — happy path", () => {
  it("정상 입력을 통과시킨다", () => {
    expect(ingredientFormInputSchema.safeParse(validInput()).success).toBe(true);
  });

  it("supplierId가 문자열이어도 통과한다", () => {
    const result = ingredientFormInputSchema.safeParse({
      ...validInput(),
      supplierId: "supplier-1" as SupplierId,
    });

    expect(result.success).toBe(true);
  });

  it("categoryIds 배열이 파싱 결과에 그대로 반영된다", () => {
    const result = ingredientFormInputSchema.safeParse({
      ...validInput(),
      categoryIds: ["category-1", "category-2"] as IngredientCategoryId[],
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.categoryIds).toEqual(["category-1", "category-2"]);
  });

  it("categoryIds가 없으면 기본값 빈 배열이다", () => {
    const { categoryIds, ...withoutCategories } = validInput();
    void categoryIds;
    const result = ingredientFormInputSchema.safeParse(withoutCategories);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.categoryIds).toEqual([]);
  });
});

describe("ingredientFormInputSchema — 검증 실패", () => {
  it("name이 빈 문자열이면 거부한다", () => {
    expect(ingredientFormInputSchema.safeParse({ ...validInput(), name: "" }).success).toBe(false);
  });

  it("packagePrice가 음수면 거부한다", () => {
    expect(ingredientFormInputSchema.safeParse({ ...validInput(), packagePrice: -1 }).success).toBe(
      false,
    );
  });

  it("packageAmount가 0이면 거부한다", () => {
    expect(ingredientFormInputSchema.safeParse({ ...validInput(), packageAmount: 0 }).success).toBe(
      false,
    );
  });

  it("stockCount가 음수면 거부한다", () => {
    expect(ingredientFormInputSchema.safeParse({ ...validInput(), stockCount: -1 }).success).toBe(
      false,
    );
  });

  it("stockUnit이 빈 문자열이면 거부한다", () => {
    expect(ingredientFormInputSchema.safeParse({ ...validInput(), stockUnit: "" }).success).toBe(
      false,
    );
  });

  it("unitWeightGram이 0 이하이면 거부한다", () => {
    expect(
      ingredientFormInputSchema.safeParse({ ...validInput(), unitWeightGram: 0 }).success,
    ).toBe(false);
  });
});
