import type { IngredientId } from "./ids";
import type { RecipeSnapshot } from "./recipeSnapshot";

export type LineChangeKind = "added" | "removed" | "changed";

export interface LineChange {
  ingredientId: IngredientId;
  kind: LineChangeKind;
  /** 이전 사용량(g). added면 null. */
  fromGram: number | null;
  /** 현재 사용량(g). removed면 null. */
  toGram: number | null;
}

/**
 * 이전 스냅샷 대비 현재 스냅샷에서 바뀐 재료 사용량 목록을 반환한다.
 * prev가 null(최초 버전)이면 비교 대상이 없으므로 빈 배열을 반환한다.
 * 순수 함수 — 재료 이름 해석은 표현 계층 책임이라 여기서는 ingredientId만 다룬다.
 */
export function diffRecipeSnapshots(
  prev: RecipeSnapshot | null,
  current: RecipeSnapshot,
): LineChange[] {
  if (prev === null) return [];

  const prevMap = new Map<IngredientId, number>();
  for (const line of prev.lines) prevMap.set(line.ingredientId, line.quantityGram);

  const currentMap = new Map<IngredientId, number>();
  for (const line of current.lines) currentMap.set(line.ingredientId, line.quantityGram);

  const changes: LineChange[] = [];

  for (const line of current.lines) {
    const before = prevMap.get(line.ingredientId);
    if (before === undefined) {
      changes.push({
        ingredientId: line.ingredientId,
        kind: "added",
        fromGram: null,
        toGram: line.quantityGram,
      });
    } else if (before !== line.quantityGram) {
      changes.push({
        ingredientId: line.ingredientId,
        kind: "changed",
        fromGram: before,
        toGram: line.quantityGram,
      });
    }
  }

  for (const line of prev.lines) {
    if (!currentMap.has(line.ingredientId)) {
      changes.push({
        ingredientId: line.ingredientId,
        kind: "removed",
        fromGram: line.quantityGram,
        toGram: null,
      });
    }
  }

  return changes;
}
