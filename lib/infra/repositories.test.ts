import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import {
  checklistRepository,
  ingredientCategoryRepository,
  ingredientPriceHistoryRepository,
  ingredientRepository,
  listChecklistItemsByDate,
  listChecklistItemsInRange,
  listIngredientPriceHistoryByIngredientId,
  listRecipeVersionsByRecipeId,
  packageUnitRepository,
  recipeCategoryRepository,
  recipeRepository,
  recipeVersionRepository,
  supplierRepository,
} from "./repositories";
import type {
  DailyChecklist,
  Ingredient,
  IngredientCategory,
  IngredientPriceHistory,
  PackageUnit,
  RecipeCategory,
  RecipeVersion,
  Supplier,
} from "../domain/entities";
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

function pos(n: number) {
  const result = parsePositiveNumber(n);
  if (!result.ok) throw new Error("test setup");
  return result.value;
}

function nn(n: number) {
  const result = parseNonNegativeNumber(n);
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
  await db.recipe_versions.clear();
  await db.suppliers.clear();
  await db.ingredient_price_history.clear();
  await db.recipe_categories.clear();
  await db.ingredient_categories.clear();
  await db.package_units.clear();
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

function version(id: string, recipeId: string, versionNo: number): RecipeVersion {
  return {
    id: id as RecipeVersionId,
    recipeId: recipeId as RecipeId,
    versionNo,
    snapshotJson: JSON.stringify({ batchSize: 1000, lines: [] }),
    createdAt: "2026-07-11T00:00:00.000Z",
  };
}

describe("recipeVersionRepository", () => {
  it("create/get 라운드트립된다", async () => {
    const v = version("v1", "r1", 1);
    await recipeVersionRepository.create(v);

    expect(await recipeVersionRepository.get(v.id)).toEqual({ ok: true, value: v });
  });
});

describe("listRecipeVersionsByRecipeId", () => {
  it("해당 recipeId의 버전만 versionNo 내림차순으로 반환한다", async () => {
    await recipeVersionRepository.create(version("v1", "r1", 1));
    await recipeVersionRepository.create(version("v2", "r1", 2));
    await recipeVersionRepository.create(version("v3", "r2", 1));

    const result = await listRecipeVersionsByRecipeId("r1" as RecipeId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((v) => v.id)).toEqual(["v2", "v1"]);
    }
  });

  it("해당 recipeId의 버전이 없으면 빈 배열을 반환한다", async () => {
    const result = await listRecipeVersionsByRecipeId("no-such-recipe" as RecipeId);

    expect(result).toEqual({ ok: true, value: [] });
  });
});

describe("supplierRepository", () => {
  it("create/get 라운드트립된다", async () => {
    const supplier: Supplier = {
      id: "supplier-1" as SupplierId,
      name: "동네유업",
      contact: "010-1234-5678",
      memo: "",
    };
    await supplierRepository.create(supplier);

    expect(await supplierRepository.get(supplier.id)).toEqual({ ok: true, value: supplier });
  });
});

function priceHistory(
  id: string,
  ingredientId: string,
  packagePrice: number,
  recordedAt: string,
): IngredientPriceHistory {
  return {
    id: id as IngredientPriceHistoryId,
    ingredientId: ingredientId as IngredientId,
    packagePrice: nn(packagePrice),
    packageAmount: pos(500),
    recordedAt,
  };
}

describe("ingredientPriceHistoryRepository", () => {
  it("create/get 라운드트립된다", async () => {
    const entry = priceHistory("ph1", "ing1", 1000, "2026-07-11T00:00:00.000Z");
    await ingredientPriceHistoryRepository.create(entry);

    expect(await ingredientPriceHistoryRepository.get(entry.id)).toEqual({
      ok: true,
      value: entry,
    });
  });
});

describe("listIngredientPriceHistoryByIngredientId", () => {
  it("해당 ingredientId의 이력만 recordedAt 내림차순으로 반환한다", async () => {
    await ingredientPriceHistoryRepository.create(
      priceHistory("ph1", "ing1", 1000, "2026-07-01T00:00:00.000Z"),
    );
    await ingredientPriceHistoryRepository.create(
      priceHistory("ph2", "ing1", 1200, "2026-07-10T00:00:00.000Z"),
    );
    await ingredientPriceHistoryRepository.create(
      priceHistory("ph3", "ing2", 500, "2026-07-05T00:00:00.000Z"),
    );

    const result = await listIngredientPriceHistoryByIngredientId("ing1" as IngredientId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((h) => h.id)).toEqual(["ph2", "ph1"]);
    }
  });

  it("해당 ingredientId의 이력이 없으면 빈 배열을 반환한다", async () => {
    const result = await listIngredientPriceHistoryByIngredientId(
      "no-such-ingredient" as IngredientId,
    );

    expect(result).toEqual({ ok: true, value: [] });
  });
});

describe("recipeCategoryRepository", () => {
  it("create/get 라운드트립된다", async () => {
    const category: RecipeCategory = {
      id: "rc-1" as RecipeCategoryId,
      name: "빙과류",
      colorHex: "#ff8800",
    };
    await recipeCategoryRepository.create(category);

    expect(await recipeCategoryRepository.get(category.id)).toEqual({
      ok: true,
      value: category,
    });
  });
});

describe("ingredientCategoryRepository", () => {
  it("create/get 라운드트립된다", async () => {
    const category: IngredientCategory = {
      id: "ic-1" as IngredientCategoryId,
      name: "유제품",
      colorHex: "#00aaff",
    };
    await ingredientCategoryRepository.create(category);

    expect(await ingredientCategoryRepository.get(category.id)).toEqual({
      ok: true,
      value: category,
    });
  });
});

describe("packageUnitRepository", () => {
  it("create/get 라운드트립된다", async () => {
    const unit: PackageUnit = {
      id: "pu-1" as PackageUnitId,
      name: "박스",
      colorHex: "#22cc55",
    };
    await packageUnitRepository.create(unit);

    expect(await packageUnitRepository.get(unit.id)).toEqual({ ok: true, value: unit });
  });
});

function checklistItem(id: string, date: string, recipeId = "r1"): DailyChecklist {
  return {
    id: id as DailyChecklistId,
    recipeId: recipeId as RecipeId,
    date,
    batchSize: pos(1000),
    status: "pending",
  };
}

describe("listChecklistItemsByDate", () => {
  it("해당 날짜의 항목만 반환한다", async () => {
    await checklistRepository.create(checklistItem("dc-1", "2026-07-11"));
    await checklistRepository.create(checklistItem("dc-2", "2026-07-11"));
    await checklistRepository.create(checklistItem("dc-3", "2026-07-12"));

    const result = await listChecklistItemsByDate("2026-07-11");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((item) => item.id).sort()).toEqual(["dc-1", "dc-2"]);
    }
  });

  it("해당 날짜에 항목이 없으면 빈 배열을 반환한다", async () => {
    const result = await listChecklistItemsByDate("2026-01-01");

    expect(result).toEqual({ ok: true, value: [] });
  });
});

describe("listChecklistItemsInRange", () => {
  it("범위 양끝을 포함하고 범위 밖은 제외한다", async () => {
    await checklistRepository.create(checklistItem("r-0", "2026-06-30"));
    await checklistRepository.create(checklistItem("r-1", "2026-07-01"));
    await checklistRepository.create(checklistItem("r-2", "2026-07-15"));
    await checklistRepository.create(checklistItem("r-3", "2026-07-31"));
    await checklistRepository.create(checklistItem("r-4", "2026-08-01"));

    const result = await listChecklistItemsInRange("2026-07-01", "2026-07-31");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((item) => item.id).sort()).toEqual(["r-1", "r-2", "r-3"]);
    }
  });

  it("범위에 항목이 없으면 빈 배열을 반환한다", async () => {
    const result = await listChecklistItemsInRange("2020-01-01", "2020-01-31");

    expect(result).toEqual({ ok: true, value: [] });
  });
});
