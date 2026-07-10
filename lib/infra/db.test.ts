import { beforeEach, describe, expect, it } from "vitest";
import { GelatoDB } from "./db";
import type {
  DailyChecklistId,
  IngredientCategoryId,
  IngredientId,
  IngredientPriceHistoryId,
  PackageUnitId,
  RecipeCategoryId,
  RecipeId,
  RecipeVersionId,
  SupplierId,
} from "../domain/ids";
import { parseNonNegativeNumber, parsePositiveNumber } from "../domain/numbers";

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

describe("GelatoDB", () => {
  let db: GelatoDB;

  beforeEach(async () => {
    db = new GelatoDB();
    await db.open();
  });

  it("버전 1로 최초 오픈에 성공한다", () => {
    expect(db.verno).toBe(1);
  });

  it("recipe_categories에 추가하고 조회할 수 있다", async () => {
    const id = "cat-1" as RecipeCategoryId;
    await db.recipe_categories.add({ id, label: "젤라또" });
    const found = await db.recipe_categories.get(id);
    expect(found).toEqual({ id, label: "젤라또" });
  });

  it("ingredient_categories에 추가하고 조회할 수 있다", async () => {
    const id = "icat-1" as IngredientCategoryId;
    await db.ingredient_categories.add({ id, label: "유제품" });
    const found = await db.ingredient_categories.get(id);
    expect(found).toEqual({ id, label: "유제품" });
  });

  it("package_units에 추가하고 조회할 수 있다", async () => {
    const id = "pu-1" as PackageUnitId;
    await db.package_units.add({ id, label: "1kg 팩", gramsPerUnit: pos(1000) });
    const found = await db.package_units.get(id);
    expect(found).toEqual({ id, label: "1kg 팩", gramsPerUnit: 1000 });
  });

  it("suppliers에 추가하고 조회할 수 있다", async () => {
    const id = "sup-1" as SupplierId;
    await db.suppliers.add({ id, name: "동네 유제품상" });
    const found = await db.suppliers.get(id);
    expect(found).toEqual({ id, name: "동네 유제품상" });
  });

  it("ingredients에 추가하고 조회할 수 있다", async () => {
    const id = "ing-1" as IngredientId;
    await db.ingredients.add({
      id,
      name: "우유",
      categoryId: null,
      supplierId: null,
      packageUnitId: null,
      currentPriceKrwPerGram: nn(3),
    });
    const found = await db.ingredients.get(id);
    expect(found?.name).toBe("우유");
  });

  it("ingredient_price_history에 추가하고 조회할 수 있다", async () => {
    const id = "iph-1" as IngredientPriceHistoryId;
    await db.ingredient_price_history.add({
      id,
      ingredientId: "ing-1" as IngredientId,
      priceKrwPerGram: nn(3),
      recordedAt: "2026-07-10T00:00:00.000Z",
    });
    const found = await db.ingredient_price_history.get(id);
    expect(found?.priceKrwPerGram).toBe(3);
  });

  it("recipes에 추가하고 조회할 수 있다", async () => {
    const id = "recipe-1" as RecipeId;
    await db.recipes.add({
      id,
      name: "바닐라 젤라또",
      categoryId: null,
      createdAt: "2026-07-10T00:00:00.000Z",
      updatedAt: "2026-07-10T00:00:00.000Z",
    });
    const found = await db.recipes.get(id);
    expect(found?.name).toBe("바닐라 젤라또");
  });

  it("recipe_versions에 추가하고 조회할 수 있다", async () => {
    const id = "rv-1" as RecipeVersionId;
    await db.recipe_versions.add({
      id,
      recipeId: "recipe-1" as RecipeId,
      versionNo: 1,
      yieldGram: pos(1000),
      lines: [],
      createdAt: "2026-07-10T00:00:00.000Z",
    });
    const found = await db.recipe_versions.get(id);
    expect(found?.versionNo).toBe(1);
  });

  it("daily_checklist에 추가하고 조회할 수 있다", async () => {
    const id = "dc-1" as DailyChecklistId;
    await db.daily_checklist.add({ id, date: "2026-07-10", note: "오늘생산 메모", isDone: false });
    const found = await db.daily_checklist.get(id);
    expect(found?.note).toBe("오늘생산 메모");
  });
});
