import { describe, expect, it } from "vitest";
import { diffRecipeSnapshots } from "./recipeVersionDiff";
import type { RecipeSnapshot, RecipeSnapshotLine } from "./recipeSnapshot";
import type { IngredientId } from "./ids";
import type { NonNegativeNumber, PositiveNumber } from "./numbers";

function line(id: string, gram: number): RecipeSnapshotLine {
  return { ingredientId: id as IngredientId, quantityGram: gram as NonNegativeNumber };
}

function snapshot(lines: RecipeSnapshotLine[]): RecipeSnapshot {
  return { batchSize: 1000 as PositiveNumber, lines };
}

describe("diffRecipeSnapshots", () => {
  it("최초 버전(prev=null)은 빈 배열을 반환한다", () => {
    expect(diffRecipeSnapshots(null, snapshot([line("milk", 500)]))).toEqual([]);
  });

  it("사용량이 바뀐 재료는 changed로, from/to를 담는다", () => {
    const result = diffRecipeSnapshots(
      snapshot([line("milk", 500)]),
      snapshot([line("milk", 2000)]),
    );
    expect(result).toEqual([
      { ingredientId: "milk", kind: "changed", fromGram: 500, toGram: 2000 },
    ]);
  });

  it("새로 추가된 재료는 added로 표시한다", () => {
    const result = diffRecipeSnapshots(
      snapshot([line("milk", 500)]),
      snapshot([line("milk", 500), line("sugar", 100)]),
    );
    expect(result).toEqual([{ ingredientId: "sugar", kind: "added", fromGram: null, toGram: 100 }]);
  });

  it("빠진 재료는 removed로 표시한다", () => {
    const result = diffRecipeSnapshots(
      snapshot([line("milk", 500), line("sugar", 100)]),
      snapshot([line("milk", 500)]),
    );
    expect(result).toEqual([
      { ingredientId: "sugar", kind: "removed", fromGram: 100, toGram: null },
    ]);
  });

  it("변화가 없으면 빈 배열을 반환한다", () => {
    const same = snapshot([line("milk", 500)]);
    expect(diffRecipeSnapshots(same, snapshot([line("milk", 500)]))).toEqual([]);
  });
});
