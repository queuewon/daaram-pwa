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
