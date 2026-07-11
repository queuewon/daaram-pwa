import { describe, expect, it } from "vitest";
import { buildRecipeVersion, latestVersionByRecipeId, nextVersionNo } from "./recipeVersion";
import { serializeRecipeSnapshot, type RecipeSnapshot } from "./recipeSnapshot";
import { parseNonNegativeNumber, parsePositiveNumber } from "./numbers";
import type { RecipeVersion } from "./entities";
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

function version(
  recipeId: string,
  versionNo: number,
  id = `${recipeId}-v${versionNo}`,
): RecipeVersion {
  return {
    id: id as RecipeVersionId,
    recipeId: recipeId as RecipeId,
    versionNo,
    snapshotJson: "{}",
    createdAt: "2026-07-12T00:00:00.000Z",
  };
}

describe("latestVersionByRecipeId", () => {
  it("레시피당 버전이 여러 개면 versionNo가 가장 큰 것만 반환한다", () => {
    const versions = [version("recipe-1", 1), version("recipe-1", 3), version("recipe-1", 2)];
    const map = latestVersionByRecipeId(versions);
    expect(map.get("recipe-1" as RecipeId)).toEqual(version("recipe-1", 3));
  });

  it("버전이 하나뿐인 레시피는 그대로 반환한다", () => {
    const versions = [version("recipe-1", 1)];
    const map = latestVersionByRecipeId(versions);
    expect(map.get("recipe-1" as RecipeId)).toEqual(version("recipe-1", 1));
  });

  it("versions가 빈 배열이면 빈 Map을 반환한다", () => {
    const map = latestVersionByRecipeId([]);
    expect(map.size).toBe(0);
  });

  it("서로 다른 레시피의 버전들이 각각 올바른 recipeId로 분리되어 매핑된다", () => {
    const versions = [
      version("recipe-1", 1),
      version("recipe-1", 2),
      version("recipe-2", 1),
      version("recipe-2", 5),
    ];
    const map = latestVersionByRecipeId(versions);
    expect(map.size).toBe(2);
    expect(map.get("recipe-1" as RecipeId)).toEqual(version("recipe-1", 2));
    expect(map.get("recipe-2" as RecipeId)).toEqual(version("recipe-2", 5));
  });
});
