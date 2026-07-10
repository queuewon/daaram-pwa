import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { createRepository } from "./repository";
import { recipeSchema } from "../domain/entities.schema";
import type { Recipe } from "../domain/entities";
import type { RecipeId } from "../domain/ids";
import { parsePositiveNumber } from "../domain/numbers";

function pos(n: number) {
  const result = parsePositiveNumber(n);
  if (!result.ok) throw new Error("test setup");
  return result.value;
}

const recipeRepository = createRepository<Recipe, RecipeId>(db.recipes, recipeSchema);

function makeRecipe(id: string): Recipe {
  return {
    id: id as RecipeId,
    name: `레시피 ${id}`,
    categoryId: null,
    batchSize: pos(1000),
    memo: "",
    createdAt: "2026-07-11T00:00:00.000Z",
    updatedAt: "2026-07-11T00:00:00.000Z",
  };
}

beforeEach(async () => {
  await db.open();
});

afterEach(async () => {
  await db.recipes.clear();
});

describe("createRepository — create/get", () => {
  it("create 후 get으로 동일한 값을 조회할 수 있다", async () => {
    const recipe = makeRecipe("r1");
    await recipeRepository.create(recipe);

    const result = await recipeRepository.get(recipe.id);

    expect(result).toEqual({ ok: true, value: recipe });
  });

  it("존재하지 않는 id를 get하면 ok(null)을 반환한다", async () => {
    const result = await recipeRepository.get("missing" as RecipeId);

    expect(result).toEqual({ ok: true, value: null });
  });

  it("DB에 스키마와 맞지 않는 오염된 행이 있으면 get이 CorruptedRecord를 반환한다", async () => {
    await db.recipes.put({ id: "broken", name: "" } as unknown as Recipe);

    const result = await recipeRepository.get("broken" as RecipeId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("CorruptedRecord");
      expect(result.error.id).toBe("broken");
    }
  });
});

describe("createRepository — list", () => {
  it("빈 테이블이면 items가 빈 배열이고 skippedCount는 0이다", async () => {
    const result = await recipeRepository.list();

    expect(result).toEqual({ ok: true, value: { items: [], skippedCount: 0 } });
  });

  it("유효한 레코드와 오염된 레코드가 섞여 있으면 유효한 것만 반환하고 개수를 센다", async () => {
    const recipe1 = makeRecipe("r1");
    const recipe2 = makeRecipe("r2");
    await recipeRepository.create(recipe1);
    await recipeRepository.create(recipe2);
    await db.recipes.put({ id: "broken", name: "" } as unknown as Recipe);

    const result = await recipeRepository.list();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toEqual(expect.arrayContaining([recipe1, recipe2]));
      expect(result.value.items).toHaveLength(2);
      expect(result.value.skippedCount).toBe(1);
    }
  });
});

describe("createRepository — update", () => {
  it("존재하는 id를 수정하면 반영된다", async () => {
    const recipe = makeRecipe("r1");
    await recipeRepository.create(recipe);
    const updated: Recipe = { ...recipe, name: "수정된 이름" };

    const result = await recipeRepository.update(updated);

    expect(result).toEqual({ ok: true, value: undefined });
    expect(await recipeRepository.get(recipe.id)).toEqual({ ok: true, value: updated });
  });

  it("존재하지 않는 id를 수정하면 NotFound를 반환하고 DB를 변경하지 않는다", async () => {
    const recipe = makeRecipe("missing");

    const result = await recipeRepository.update(recipe);

    expect(result).toEqual({ ok: false, error: { type: "NotFound", id: "missing" } });
    expect(await db.recipes.count()).toBe(0);
  });
});

describe("createRepository — remove", () => {
  it("존재하는 id를 삭제하면 이후 get은 ok(null)이 된다", async () => {
    const recipe = makeRecipe("r1");
    await recipeRepository.create(recipe);

    await recipeRepository.remove(recipe.id);

    expect(await recipeRepository.get(recipe.id)).toEqual({ ok: true, value: null });
  });

  it("존재하지 않는 id를 삭제해도 에러 없이 성공한다 (멱등)", async () => {
    await expect(recipeRepository.remove("missing" as RecipeId)).resolves.toBeUndefined();
  });
});
