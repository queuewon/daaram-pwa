import { describe, expect, it } from "vitest";
import { buildRecipeVersion, nextVersionNo } from "./recipeVersion";
import { serializeRecipeSnapshot, type RecipeSnapshot } from "./recipeSnapshot";
import { parseNonNegativeNumber, parsePositiveNumber } from "./numbers";
import type { IngredientId, RecipeId, RecipeVersionId } from "./ids";

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

describe("nextVersionNo", () => {
  it("기존 버전이 없으면 1을 반환한다", () => {
    expect(nextVersionNo([])).toBe(1);
  });

  it("연속된 버전 번호면 다음 번호를 반환한다", () => {
    expect(nextVersionNo([1, 2, 3])).toBe(4);
  });

  it("중간에 구멍이 있어도 최댓값+1을 반환한다", () => {
    expect(nextVersionNo([1, 3])).toBe(4);
  });
});

describe("buildRecipeVersion", () => {
  it("snapshot을 직렬화하여 RecipeVersion을 만든다", () => {
    const snapshot: RecipeSnapshot = {
      batchSize: pos(1000),
      lines: [{ ingredientId: "ingredient-a" as IngredientId, quantityGram: nn(100) }],
    };

    const version = buildRecipeVersion({
      id: "version-1" as RecipeVersionId,
      recipeId: "recipe-1" as RecipeId,
      versionNo: 1,
      snapshot,
      createdAt: "2026-07-11T00:00:00.000Z",
    });

    expect(version).toEqual({
      id: "version-1",
      recipeId: "recipe-1",
      versionNo: 1,
      snapshotJson: serializeRecipeSnapshot(snapshot),
      createdAt: "2026-07-11T00:00:00.000Z",
    });
  });
});
