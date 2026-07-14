import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../lib/infra/db";
import { useIngredientStore } from "./ingredientStore";
import type { IngredientCategoryId, IngredientId } from "../lib/domain/ids";

beforeEach(async () => {
  await db.open();
  useIngredientStore.setState({ ingredients: [], priceHistory: [] });
});

afterEach(async () => {
  await db.ingredients.clear();
  await db.ingredient_price_history.clear();
});

function validForm(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    name: "우유",
    categoryId: null,
    supplierId: null,
    packagePrice: 1000,
    packageAmount: 500,
    stockCount: 10,
    stockUnit: "개",
    unitWeightGram: 1,
    ...overrides,
  };
}

describe("ingredientStore.saveIngredient — 생성", () => {
  it("ingredientId가 null이면 새 Ingredient와 최초 가격이력 1건을 만든다", async () => {
    const result = await useIngredientStore.getState().saveIngredient({
      ingredientId: null,
      form: validForm(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.pricePerGram).toBe(2);
    expect(useIngredientStore.getState().ingredients).toHaveLength(1);
    expect(useIngredientStore.getState().priceHistory).toHaveLength(1);
    expect(useIngredientStore.getState().priceHistory[0].packagePrice).toBe(1000);
  });

  it("unitWeightGram을 저장한다", async () => {
    const result = await useIngredientStore.getState().saveIngredient({
      ingredientId: null,
      form: validForm({ stockUnit: "봉", unitWeightGram: 1000 }),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.unitWeightGram).toBe(1000);
  });

  it("잘못된 폼 입력이면 InvalidForm 오류를 반환하고 아무것도 저장하지 않는다", async () => {
    const result = await useIngredientStore.getState().saveIngredient({
      ingredientId: null,
      form: validForm({ name: "" }),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("InvalidForm");
    expect(useIngredientStore.getState().ingredients).toHaveLength(0);
  });
});

describe("ingredientStore.saveIngredient — 수정", () => {
  it("packagePrice가 변경되면 새 가격이력이 추가되고 기존 이력은 보존된다", async () => {
    const created = await useIngredientStore.getState().saveIngredient({
      ingredientId: null,
      form: validForm(),
    });
    if (!created.ok) throw new Error("test setup");
    const ingredientId = created.value.id;

    const updated = await useIngredientStore.getState().saveIngredient({
      ingredientId,
      form: validForm({ packagePrice: 1200 }),
    });

    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.pricePerGram).toBe(2.4);

    await useIngredientStore.getState().loadPriceHistory(ingredientId);
    const history = useIngredientStore.getState().priceHistory;
    expect(history.map((h) => h.packagePrice)).toEqual([1200, 1000]);
  });

  it("packagePrice/packageAmount가 그대로면(이름만 변경) 가격이력을 추가하지 않는다", async () => {
    const created = await useIngredientStore.getState().saveIngredient({
      ingredientId: null,
      form: validForm(),
    });
    if (!created.ok) throw new Error("test setup");
    const ingredientId = created.value.id;

    await useIngredientStore.getState().saveIngredient({
      ingredientId,
      form: validForm({ name: "저지방 우유" }),
    });

    await useIngredientStore.getState().loadPriceHistory(ingredientId);
    expect(useIngredientStore.getState().priceHistory).toHaveLength(1);
  });

  it("존재하지 않는 ingredientId로 수정하면 NotFound 오류를 반환한다", async () => {
    const result = await useIngredientStore.getState().saveIngredient({
      ingredientId: "no-such-ingredient" as IngredientId,
      form: validForm(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("NotFound");
  });
});

describe("ingredientStore.saveIngredient — categoryIds", () => {
  it("생성 시 폼의 categoryIds를 반영한다", async () => {
    const result = await useIngredientStore.getState().saveIngredient({
      ingredientId: null,
      form: validForm({ categoryIds: ["category-1", "category-2"] as IngredientCategoryId[] }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.categoryIds).toEqual(["category-1", "category-2"]);
  });

  it("수정 시 폼의 categoryIds로 교체한다", async () => {
    const created = await useIngredientStore.getState().saveIngredient({
      ingredientId: null,
      form: validForm({ categoryIds: ["category-1"] as IngredientCategoryId[] }),
    });
    if (!created.ok) throw new Error("test setup");

    const updated = await useIngredientStore.getState().saveIngredient({
      ingredientId: created.value.id,
      form: validForm({ categoryIds: ["category-2"] as IngredientCategoryId[] }),
    });

    expect(updated.ok).toBe(true);
    if (updated.ok) expect(updated.value.categoryIds).toEqual(["category-2"]);
  });
});

describe("ingredientStore.removeIngredient", () => {
  it("재료를 목록에서 제거한다", async () => {
    const created = await useIngredientStore.getState().saveIngredient({
      ingredientId: null,
      form: validForm(),
    });
    if (!created.ok) throw new Error("test setup");

    await useIngredientStore.getState().removeIngredient(created.value.id);

    expect(useIngredientStore.getState().ingredients).toHaveLength(0);
  });
});
