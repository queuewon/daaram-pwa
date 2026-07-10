import { describe, expect, it } from "vitest";
import {
  parseRecipeSnapshot,
  serializeRecipeSnapshot,
  type RecipeSnapshot,
} from "./recipeSnapshot";
import { parseNonNegativeNumber, parsePositiveNumber } from "./numbers";
import type { IngredientId } from "./ids";

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

const ingredientA = "ingredient-a" as IngredientId;

describe("serializeRecipeSnapshot / parseRecipeSnapshot 라운드트립", () => {
  it("직렬화한 스냅샷을 파싱하면 동일한 값이 나온다", () => {
    const snapshot: RecipeSnapshot = {
      batchSize: pos(1000),
      lines: [{ ingredientId: ingredientA, quantityGram: nn(100) }],
    };

    const json = serializeRecipeSnapshot(snapshot);
    const result = parseRecipeSnapshot(json);

    expect(result).toEqual({ ok: true, value: snapshot });
  });

  it("lines가 빈 배열이어도 허용한다", () => {
    const snapshot: RecipeSnapshot = { batchSize: pos(500), lines: [] };

    const result = parseRecipeSnapshot(serializeRecipeSnapshot(snapshot));

    expect(result).toEqual({ ok: true, value: snapshot });
  });
});

describe("parseRecipeSnapshot 검증 실패", () => {
  it("batchSize가 0 이하이면 거부한다", () => {
    const result = parseRecipeSnapshot(JSON.stringify({ batchSize: 0, lines: [] }));

    expect(result.ok).toBe(false);
  });

  it("스키마와 맞지 않는 JSON은 거부한다", () => {
    const result = parseRecipeSnapshot(JSON.stringify({ notASnapshot: true }));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("InvalidSnapshot");
  });

  it("JSON 자체가 깨져 있어도 예외를 던지지 않고 Result로 반환한다", () => {
    const result = parseRecipeSnapshot("{ not valid json");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("InvalidSnapshot");
  });
});
