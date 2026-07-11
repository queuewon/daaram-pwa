import { describe, expect, it } from "vitest";
import { filterIngredients } from "./ingredientFilter";
import { parseNonNegativeNumber, parsePositiveNumber } from "./numbers";
import type { Ingredient } from "./entities";
import type { IngredientCategoryId, IngredientId } from "./ids";

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

const categoryA = "category-a" as IngredientCategoryId;
const categoryB = "category-b" as IngredientCategoryId;

function ingredient(params: {
  id: string;
  name: string;
  categoryId?: IngredientCategoryId | null;
}): Ingredient {
  return {
    id: params.id as IngredientId,
    name: params.name,
    categoryId: params.categoryId ?? null,
    supplierId: null,
    packagePrice: nn(1000),
    packageAmount: pos(500),
    pricePerGram: nn(2),
    stockCount: nn(5),
    stockUnit: "개",
  };
}

const strawberryPuree = ingredient({ id: "i1", name: "딸기 퓨레", categoryId: categoryA });
const mangoPuree = ingredient({ id: "i2", name: "망고 퓨레", categoryId: categoryB });
const uncategorized = ingredient({ id: "i3", name: "설탕", categoryId: null });

const ingredients = [strawberryPuree, mangoPuree, uncategorized];

describe("filterIngredients", () => {
  it("빈 검색어와 categoryId=null이면 전체 재료를 반환한다", () => {
    expect(filterIngredients(ingredients, { searchText: "", categoryId: null })).toEqual(
      ingredients,
    );
  });

  it("검색어로 이름에 부분일치하는 재료만 반환한다", () => {
    expect(filterIngredients(ingredients, { searchText: "퓨레", categoryId: null })).toEqual([
      strawberryPuree,
      mangoPuree,
    ]);
  });

  it("검색어 대소문자를 다르게 입력해도 동일하게 매칭된다", () => {
    const upperCaseIngredients = [ingredient({ id: "i4", name: "Gelato Base" })];
    expect(
      filterIngredients(upperCaseIngredients, { searchText: "gelato", categoryId: null }),
    ).toEqual(upperCaseIngredients);
  });

  it("검색어 앞뒤 공백은 무시하고 매칭한다", () => {
    expect(filterIngredients(ingredients, { searchText: "  딸기  ", categoryId: null })).toEqual([
      strawberryPuree,
    ]);
  });

  it("categoryId를 지정하면 해당 카테고리 재료만 반환하고 카테고리 없는 재료는 제외한다", () => {
    expect(filterIngredients(ingredients, { searchText: "", categoryId: categoryA })).toEqual([
      strawberryPuree,
    ]);
  });

  it("검색어와 categoryId를 함께 지정하면 AND로 좁혀진다", () => {
    expect(filterIngredients(ingredients, { searchText: "망고", categoryId: categoryB })).toEqual([
      mangoPuree,
    ]);
    expect(filterIngredients(ingredients, { searchText: "망고", categoryId: categoryA })).toEqual(
      [],
    );
  });

  it("조건에 맞는 재료가 없으면 빈 배열을 반환한다", () => {
    expect(
      filterIngredients(ingredients, { searchText: "존재하지않음", categoryId: null }),
    ).toEqual([]);
  });

  it("ingredients가 빈 배열이면 결과도 빈 배열이다", () => {
    expect(filterIngredients([], { searchText: "", categoryId: null })).toEqual([]);
  });
});
