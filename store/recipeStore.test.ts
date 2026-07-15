import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../lib/infra/db";
import { useRecipeStore } from "./recipeStore";
import type { IngredientId, RecipeId } from "../lib/domain/ids";

beforeEach(async () => {
  await db.open();
  useRecipeStore.setState({ recipes: [], versions: [] });
});

afterEach(async () => {
  await db.recipes.clear();
  await db.recipe_versions.clear();
});

function validForm(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    name: "피스타치오 젤라또",
    categoryIds: [],
    memo: "",
    lines: [{ ingredientId: "ingredient-a" as IngredientId, quantityGram: 100 }],
    ...overrides,
  };
}

describe("recipeStore.saveRecipe — 생성", () => {
  it("recipeId가 null이면 새 Recipe와 버전 1을 만든다", async () => {
    const result = await useRecipeStore.getState().saveRecipe({
      recipeId: null,
      form: validForm(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.name).toBe("피스타치오 젤라또");
    expect(result.value.batchSize).toBe(100); // 재료 합(100)으로 파생
    expect(useRecipeStore.getState().recipes).toHaveLength(1);
    expect(useRecipeStore.getState().versions).toHaveLength(1);
    expect(useRecipeStore.getState().versions[0].versionNo).toBe(1);
  });

  it("재료가 없으면(총량 0) InvalidForm으로 거부한다", async () => {
    const result = await useRecipeStore.getState().saveRecipe({
      recipeId: null,
      form: validForm({ lines: [] }),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("InvalidForm");
  });

  it("잘못된 폼 입력이면 InvalidForm 오류를 반환하고 아무것도 저장하지 않는다", async () => {
    const result = await useRecipeStore.getState().saveRecipe({
      recipeId: null,
      form: validForm({ name: "" }),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("InvalidForm");
    expect(useRecipeStore.getState().recipes).toHaveLength(0);
  });
});

describe("recipeStore.saveRecipe — 수정", () => {
  it("기존 레시피를 수정하면 새 버전이 추가되고 이전 버전은 보존된다", async () => {
    const created = await useRecipeStore.getState().saveRecipe({
      recipeId: null,
      form: validForm(),
    });
    if (!created.ok) throw new Error("test setup");
    const recipeId = created.value.id;

    const updated = await useRecipeStore.getState().saveRecipe({
      recipeId,
      form: validForm({
        lines: [{ ingredientId: "ingredient-a" as IngredientId, quantityGram: 300 }],
      }),
    });

    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.batchSize).toBe(300); // 재료 합(300)으로 재계산

    await useRecipeStore.getState().loadVersions(recipeId);
    const versions = useRecipeStore.getState().versions;
    expect(versions.map((v) => v.versionNo)).toEqual([2, 1]);
  });

  it("존재하지 않는 recipeId로 수정하면 NotFound 오류를 반환한다", async () => {
    const result = await useRecipeStore.getState().saveRecipe({
      recipeId: "no-such-recipe" as RecipeId,
      form: validForm(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("NotFound");
  });
});

describe("recipeStore.removeRecipe", () => {
  it("레시피를 목록에서 제거한다", async () => {
    const created = await useRecipeStore.getState().saveRecipe({
      recipeId: null,
      form: validForm(),
    });
    if (!created.ok) throw new Error("test setup");

    await useRecipeStore.getState().removeRecipe(created.value.id);

    expect(useRecipeStore.getState().recipes).toHaveLength(0);
  });
});
