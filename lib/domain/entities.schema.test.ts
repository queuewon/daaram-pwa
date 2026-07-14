import { describe, expect, it } from "vitest";
import {
  createIngredient,
  ingredientCategorySchema,
  ingredientSchema,
  packageUnitSchema,
  recipeCategorySchema,
  recipeSchema,
} from "./entities.schema";
import { parseNonNegativeNumber, parsePositiveNumber } from "./numbers";

function nn(n: number) {
  const result = parseNonNegativeNumber(n);
  if (!result.ok) throw new Error("test setup");
  return result.value;
}

function pos(n: number) {
  const result = parsePositiveNumber(n);
  if (!result.ok) throw new Error("test setup");
  return result.value;
}

describe("labelSchema 기반 스키마 (RecipeCategory/IngredientCategory/PackageUnit)", () => {
  it("recipeCategorySchema: 유효한 값을 통과시킨다", () => {
    const result = recipeCategorySchema.safeParse({
      id: "cat-1",
      name: "젤라또",
      colorHex: "#4f46e5",
    });
    expect(result.success).toBe(true);
  });

  it("colorHex가 #RRGGBB 형식이 아니면 거부한다", () => {
    const result = recipeCategorySchema.safeParse({
      id: "cat-1",
      name: "젤라또",
      colorHex: "#fff",
    });
    expect(result.success).toBe(false);
  });

  it("name이 빈 문자열이면 거부한다", () => {
    const result = ingredientCategorySchema.safeParse({
      id: "icat-1",
      name: "",
      colorHex: "#4f46e5",
    });
    expect(result.success).toBe(false);
  });

  it("packageUnitSchema도 동일한 형태를 검증한다", () => {
    const result = packageUnitSchema.safeParse({ id: "pu-1", name: "1kg 팩", colorHex: "#123abc" });
    expect(result.success).toBe(true);
  });
});

describe("createIngredient", () => {
  it("packagePrice/packageAmount로부터 pricePerGram을 정확히 파생시킨다", () => {
    const result = createIngredient({
      id: "ing-1" as never,
      name: "우유",
      categoryIds: [],
      supplierId: null,
      packagePrice: nn(1000),
      packageAmount: pos(500),
      stockCount: nn(0),
      stockUnit: "개",
      unitWeightGram: pos(1),
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.pricePerGram).toBe(2);
  });
});

describe("ingredientSchema", () => {
  it("pricePerGram이 packagePrice/packageAmount와 일치하면 통과한다", () => {
    const result = ingredientSchema.safeParse({
      id: "ing-1",
      name: "우유",
      categoryId: null,
      supplierId: null,
      packagePrice: 1000,
      packageAmount: 500,
      pricePerGram: 2,
      stockCount: 0,
      stockUnit: "개",
    });
    expect(result.success).toBe(true);
  });

  it("pricePerGram이 packagePrice/packageAmount와 불일치하면 거부한다", () => {
    const result = ingredientSchema.safeParse({
      id: "ing-1",
      name: "우유",
      categoryId: null,
      supplierId: null,
      packagePrice: 1000,
      packageAmount: 500,
      pricePerGram: 999,
      stockCount: 0,
      stockUnit: "개",
    });
    expect(result.success).toBe(false);
  });

  it("packagePrice가 음수면 거부한다", () => {
    const result = ingredientSchema.safeParse({
      id: "ing-1",
      name: "우유",
      categoryId: null,
      supplierId: null,
      packagePrice: -1,
      packageAmount: 500,
      pricePerGram: 0,
      stockCount: 0,
      stockUnit: "개",
    });
    expect(result.success).toBe(false);
  });

  it("unitWeightGram이 없는 레거시 레코드는 1로 채워 파싱한다", () => {
    const result = ingredientSchema.safeParse({
      id: "ing-1",
      name: "우유",
      categoryId: null,
      supplierId: null,
      packagePrice: 1000,
      packageAmount: 500,
      pricePerGram: 2,
      stockCount: 0,
      stockUnit: "봉",
      // unitWeightGram 없음 (구버전)
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.unitWeightGram).toBe(1);
  });

  it("unitWeightGram이 0이면 거부한다", () => {
    const result = ingredientSchema.safeParse({
      id: "ing-1",
      name: "우유",
      categoryId: null,
      supplierId: null,
      packagePrice: 1000,
      packageAmount: 500,
      pricePerGram: 2,
      stockCount: 0,
      stockUnit: "봉",
      unitWeightGram: 0,
    });
    expect(result.success).toBe(false);
  });

  it("레거시 categoryId(값)은 categoryIds=[id]로 정규화한다", () => {
    const result = ingredientSchema.safeParse({
      id: "ing-1",
      name: "우유",
      categoryId: "icat-1",
      supplierId: null,
      packagePrice: 1000,
      packageAmount: 500,
      pricePerGram: 2,
      stockCount: 0,
      stockUnit: "g",
      unitWeightGram: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.categoryIds).toEqual(["icat-1"]);
  });

  it("레거시 categoryId=null은 categoryIds=[]로 정규화한다", () => {
    const result = ingredientSchema.safeParse({
      id: "ing-1",
      name: "우유",
      categoryId: null,
      supplierId: null,
      packagePrice: 1000,
      packageAmount: 500,
      pricePerGram: 2,
      stockCount: 0,
      stockUnit: "g",
      unitWeightGram: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.categoryIds).toEqual([]);
  });
});

describe("recipeSchema — 레거시 categoryId 정규화", () => {
  it("categoryId(값)은 categoryIds=[id]로 정규화한다", () => {
    const result = recipeSchema.safeParse({
      id: "r-1",
      name: "딸기 젤라또",
      categoryId: "cat-1",
      batchSize: 1000,
      memo: "",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.categoryIds).toEqual(["cat-1"]);
  });
});
