import { describe, expect, it } from "vitest";
import { filterRecipes } from "./recipeFilter";
import { parsePositiveNumber } from "./numbers";
import type { Recipe } from "./entities";
import type { RecipeCategoryId, RecipeId } from "./ids";

function pos(n: number) {
  const result = parsePositiveNumber(n);
  if (!result.ok) throw new Error("test setup");
  return result.value;
}

const categoryA = "category-a" as RecipeCategoryId;
const categoryB = "category-b" as RecipeCategoryId;

function recipe(params: { id: string; name: string; categoryIds?: RecipeCategoryId[] }): Recipe {
  return {
    id: params.id as RecipeId,
    name: params.name,
    categoryIds: params.categoryIds ?? [],
    batchSize: pos(1000),
    memo: "",
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z",
  };
}

const strawberry = recipe({ id: "r1", name: "딸기 젤라또", categoryIds: [categoryA] });
const mango = recipe({ id: "r2", name: "망고 소르베", categoryIds: [categoryB] });
const uncategorized = recipe({ id: "r3", name: "바닐라 젤라또", categoryIds: [] });

const recipes = [strawberry, mango, uncategorized];

describe("filterRecipes", () => {
  it("빈 검색어와 categoryId=null이면 전체 레시피를 반환한다", () => {
    expect(filterRecipes(recipes, { searchText: "", categoryId: null })).toEqual(recipes);
  });

  it("검색어로 이름에 부분일치하는 레시피만 반환한다", () => {
    expect(filterRecipes(recipes, { searchText: "젤라또", categoryId: null })).toEqual([
      strawberry,
      uncategorized,
    ]);
  });

  it("검색어 대소문자를 다르게 입력해도 동일하게 매칭된다", () => {
    const upperCaseRecipes = [recipe({ id: "r4", name: "Gelato Base" })];
    expect(filterRecipes(upperCaseRecipes, { searchText: "gelato", categoryId: null })).toEqual(
      upperCaseRecipes,
    );
  });

  it("검색어 앞뒤 공백은 무시하고 매칭한다", () => {
    expect(filterRecipes(recipes, { searchText: "  딸기  ", categoryId: null })).toEqual([
      strawberry,
    ]);
  });

  it("categoryId를 지정하면 해당 카테고리 레시피만 반환하고 카테고리 없는 레시피는 제외한다", () => {
    expect(filterRecipes(recipes, { searchText: "", categoryId: categoryA })).toEqual([strawberry]);
  });

  it("검색어와 categoryId를 함께 지정하면 AND로 좁혀진다", () => {
    expect(filterRecipes(recipes, { searchText: "소르베", categoryId: categoryB })).toEqual([
      mango,
    ]);
    expect(filterRecipes(recipes, { searchText: "소르베", categoryId: categoryA })).toEqual([]);
  });

  it("여러 카테고리를 가진 레시피는 각 카테고리 필터에 모두 매칭된다", () => {
    const multi = recipe({ id: "r5", name: "믹스 젤라또", categoryIds: [categoryA, categoryB] });
    const list = [multi];
    expect(filterRecipes(list, { searchText: "", categoryId: categoryA })).toEqual([multi]);
    expect(filterRecipes(list, { searchText: "", categoryId: categoryB })).toEqual([multi]);
  });

  it("조건에 맞는 레시피가 없으면 빈 배열을 반환한다", () => {
    expect(filterRecipes(recipes, { searchText: "존재하지않음", categoryId: null })).toEqual([]);
  });

  it("recipes가 빈 배열이면 결과도 빈 배열이다", () => {
    expect(filterRecipes([], { searchText: "", categoryId: null })).toEqual([]);
  });
});
