import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { exportBackup, importBackup } from "./backup";
import type { RecipeId } from "../domain/ids";
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
    categoryId: null,
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
            categoryId: null,
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
