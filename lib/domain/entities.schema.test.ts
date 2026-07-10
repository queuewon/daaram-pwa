import { describe, expect, it } from "vitest";
import {
  createIngredient,
  ingredientCategorySchema,
  ingredientSchema,
  packageUnitSchema,
  recipeCategorySchema,
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
      categoryId: null,
      supplierId: null,
      packagePrice: nn(1000),
      packageAmount: pos(500),
      stockCount: nn(0),
      stockUnit: "개",
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
});
