import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { checklistRepository, ingredientRepository, recipeRepository } from "./repositories";
import type { Ingredient, DailyChecklist } from "../domain/entities";
import type { IngredientId, DailyChecklistId, RecipeId } from "../domain/ids";
import { parsePositiveNumber } from "../domain/numbers";

function pos(n: number) {
  const result = parsePositiveNumber(n);
  if (!result.ok) throw new Error("test setup");
  return result.value;
}

beforeEach(async () => {
  await db.open();
});

afterEach(async () => {
  await db.ingredients.clear();
  await db.daily_checklist.clear();
  await db.recipes.clear();
});

describe("recipeRepository (재수출 확인)", () => {
  it("createRepository로 만든 인스턴스를 그대로 재사용한다", async () => {
    expect(await recipeRepository.list()).toEqual({
      ok: true,
      value: { items: [], skippedCount: 0 },
    });
  });
});

describe("ingredientRepository — 스키마 고유 오염 케이스", () => {
  it("pricePerGram 불변식이 깨진 레코드는 CorruptedRecord로 취급한다", async () => {
    await db.ingredients.put({
      id: "broken-ing",
      name: "우유",
      categoryId: null,
      supplierId: null,
      packagePrice: 1000,
      packageAmount: 500,
      pricePerGram: 999, // 1000/500=2 여야 하는데 불변식 위반
      stockCount: 0,
      stockUnit: "개",
    } as unknown as Ingredient);

    const result = await ingredientRepository.get("broken-ing" as IngredientId);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("CorruptedRecord");
  });
});

describe("checklistRepository — 스키마 고유 오염 케이스", () => {
  it("status가 열거값 밖이면 CorruptedRecord로 취급한다", async () => {
    await db.daily_checklist.put({
      id: "broken-dc",
      recipeId: "r1",
      date: "2026-07-11",
      batchSize: 1000,
      status: "not-a-real-status",
    } as unknown as DailyChecklist);

    const result = await checklistRepository.get("broken-dc" as DailyChecklistId);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("CorruptedRecord");
  });

  it("정상 체크리스트는 라운드트립된다", async () => {
    const checklist: DailyChecklist = {
      id: "dc-1" as DailyChecklistId,
      recipeId: "r1" as RecipeId,
      date: "2026-07-11",
      batchSize: pos(1000),
      status: "pending",
    };
    await checklistRepository.create(checklist);

    expect(await checklistRepository.get(checklist.id)).toEqual({ ok: true, value: checklist });
  });
});
