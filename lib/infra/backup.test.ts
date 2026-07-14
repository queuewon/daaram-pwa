import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { buildEmptyBackupFile, exportBackup, importBackup, wipeAllData } from "./backup";
import { backupFileSchema, BACKUP_TABLE_NAMES } from "./backup.schema";
import type { IngredientCategoryId, RecipeId, SupplierId } from "../domain/ids";
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
  await db.recipes.clear();
  await db.recipe_versions.clear();
  await db.ingredients.clear();
  await db.ingredient_price_history.clear();
  await db.suppliers.clear();
  await db.daily_checklist.clear();
  await db.recipe_categories.clear();
  await db.ingredient_categories.clear();
  await db.package_units.clear();
});

async function addRecipe(id: string) {
  await db.recipes.add({
    id: id as RecipeId,
    name: `레시피 ${id}`,
    categoryIds: [],
    batchSize: pos(1000),
    memo: "",
    createdAt: "2026-07-10T00:00:00.000Z",
    updatedAt: "2026-07-10T00:00:00.000Z",
  });
}

describe("exportBackup / importBackup 라운드트립", () => {
  it("export한 백업을 import하면 데이터가 동일하게 복원된다", async () => {
    await addRecipe("r1");
    const backup = await exportBackup();

    await db.recipes.clear();
    const result = await importBackup(backup);

    expect(result).toEqual({ ok: true, value: undefined });
    const restored = await db.recipes.toArray();
    expect(restored).toEqual(backup.data.recipes);
  });
});

describe("importBackup 검증 실패", () => {
  it("스키마에 맞지 않는 JSON은 거부하고 DB를 변경하지 않는다", async () => {
    await addRecipe("r1");
    const before = await db.recipes.toArray();

    const result = await importBackup({ not: "a valid backup" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("ValidationError");
    expect(await db.recipes.toArray()).toEqual(before);
  });

  it("구버전(v1) 백업 파일은 UnsupportedVersion으로 거부하고 DB를 변경하지 않는다 (F5)", async () => {
    await addRecipe("r1");
    const before = await db.recipes.toArray();
    const backup = await exportBackup();

    const result = await importBackup({ ...backup, schemaVersion: 1 });

    expect(result).toEqual({ ok: false, error: { type: "UnsupportedVersion", found: 1 } });
    expect(await db.recipes.toArray()).toEqual(before);
  });
});

describe("importBackup 대량 소실 방지 (F5)", () => {
  it("기존에 레코드가 있는데 신규 백업이 0개면 forceEmpty 없이는 거부한다", async () => {
    const emptyBackup = await exportBackup();
    await addRecipe("r1");
    const before = await db.recipes.toArray();

    const result = await importBackup(emptyBackup);

    expect(result).toEqual({
      ok: false,
      error: { type: "RequiresConfirmation", emptiedTables: ["recipes"] },
    });
    expect(await db.recipes.toArray()).toEqual(before);
  });

  it("forceEmpty: true면 레코드 급감을 허용한다", async () => {
    const emptyBackup = await exportBackup();
    await addRecipe("r1");

    const result = await importBackup(emptyBackup, { forceEmpty: true });

    expect(result).toEqual({ ok: true, value: undefined });
    expect(await db.recipes.toArray()).toEqual([]);
  });
});

describe("importBackup 트랜잭션 원자성 (F5)", () => {
  it("뒤쪽 테이블 쓰기가 실패하면 이미 처리된 앞쪽 테이블 변경분까지 전부 롤백된다", async () => {
    await addRecipe("r1");
    const beforeRecipes = await db.recipes.toArray();
    const beforeVersions = await db.recipe_versions.toArray();

    const backup = await exportBackup();
    // recipe_versions에 동일 id를 가진 레코드 2개를 넣어 bulkAdd가 ConstraintError로
    // 실패하도록 강제한다 — recipes는 이미 clear+bulkAdd된 뒤에 실패해야 롤백을 검증할 수 있다.
    const corruptedBackup = {
      ...backup,
      data: {
        ...backup.data,
        recipes: [
          {
            id: "new-recipe" as RecipeId,
            name: "새 레시피",
            categoryIds: [],
            batchSize: pos(1000),
            memo: "",
            createdAt: "2026-07-11T00:00:00.000Z",
            updatedAt: "2026-07-11T00:00:00.000Z",
          },
        ],
        recipe_versions: [
          {
            id: "dup-version",
            recipeId: "new-recipe",
            versionNo: 1,
            snapshotJson: JSON.stringify({ batchSize: 1000, lines: [] }),
            createdAt: "2026-07-11T00:00:00.000Z",
          },
          {
            id: "dup-version",
            recipeId: "new-recipe",
            versionNo: 2,
            snapshotJson: JSON.stringify({ batchSize: 1000, lines: [] }),
            createdAt: "2026-07-11T00:00:01.000Z",
          },
        ],
      },
    };

    await expect(importBackup(corruptedBackup, { forceEmpty: true })).rejects.toBeDefined();

    expect(await db.recipes.toArray()).toEqual(beforeRecipes);
    expect(await db.recipe_versions.toArray()).toEqual(beforeVersions);
  });
});

describe("importBackup 하위호환 (F5)", () => {
  it("unitWeightGram이 없는 옛 백업의 재료는 unitWeightGram=1로 복원한다", async () => {
    const backup = buildEmptyBackupFile();
    // 구버전 백업: 재료에 unitWeightGram 필드 없음
    backup.data.ingredients = [
      {
        id: "ing-legacy",
        name: "우유",
        categoryIds: [],
        supplierId: null,
        packagePrice: 1000,
        packageAmount: 500,
        pricePerGram: 2,
        stockCount: 0,
        stockUnit: "봉",
      },
    ] as never;

    const result = await importBackup(backup, { forceEmpty: true });

    expect(result.ok).toBe(true);
    const restored = await db.ingredients.get("ing-legacy" as never);
    expect(restored?.unitWeightGram).toBe(1);
  });

  it("categoryId만 있는 옛 백업은 categoryIds로 정규화해 복원한다", async () => {
    const backup = buildEmptyBackupFile();
    backup.data.recipes = [
      {
        id: "r-legacy",
        name: "딸기",
        categoryId: "cat-1",
        batchSize: 1000,
        memo: "",
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
      },
    ] as never;

    const result = await importBackup(backup, { forceEmpty: true });

    expect(result.ok).toBe(true);
    const restored = await db.recipes.get("r-legacy" as never);
    expect(restored?.categoryIds).toEqual(["cat-1"]);
    expect(restored).not.toHaveProperty("categoryId");
  });
});

describe("buildEmptyBackupFile", () => {
  it("backupFileSchema를 통과하는 유효한 빈 백업을 생성한다", () => {
    const empty = buildEmptyBackupFile();
    expect(backupFileSchema.safeParse(empty).success).toBe(true);
  });

  it("9개 테이블 모두 빈 배열이다", () => {
    const empty = buildEmptyBackupFile();
    for (const name of BACKUP_TABLE_NAMES) {
      expect(empty.data[name]).toEqual([]);
    }
  });
});

describe("wipeAllData (F5)", () => {
  it("여러 테이블에 데이터가 있어도 전부 비운다", async () => {
    await addRecipe("r1");
    await db.ingredient_categories.add({
      id: "cat-1" as IngredientCategoryId,
      name: "유제품",
      colorHex: "#C2185B",
    });
    await db.suppliers.add({
      id: "sup-1" as SupplierId,
      name: "공급업체",
      contact: "",
      memo: "",
    });

    const result = await wipeAllData();

    expect(result).toEqual({ ok: true, value: undefined });
    for (const name of BACKUP_TABLE_NAMES) {
      expect(await db[name].count()).toBe(0);
    }
  });
});
