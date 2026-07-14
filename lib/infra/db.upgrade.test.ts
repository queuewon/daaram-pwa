import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { GelatoDB } from "./db";

// v1 스키마(구버전)로 raw Dexie를 만들어 시드한 뒤, GelatoDB(v2)로 열어 upgrade가 실행되는지 검증한다. [F6]
const V1_STORES = {
  recipes: "id, categoryId",
  recipe_versions: "id, recipeId",
  ingredients: "id, categoryId, supplierId, packageUnitId",
  ingredient_price_history: "id, ingredientId, recordedAt",
  suppliers: "id",
  daily_checklist: "id, date",
  recipe_categories: "id",
  ingredient_categories: "id",
  package_units: "id",
};

let dbName = "";

afterEach(async () => {
  if (dbName) await Dexie.delete(dbName);
  dbName = "";
});

async function seedV1(name: string): Promise<void> {
  const legacy = new Dexie(name);
  legacy.version(1).stores(V1_STORES);
  await legacy.open();
  await legacy.table("recipes").add({
    id: "r1",
    name: "바닐라",
    categoryId: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  });
  await legacy.table("ingredients").add({
    id: "ing1",
    name: "우유",
    categoryId: null,
    supplierId: null,
    packageUnitId: null,
    currentPriceKrwPerGram: 3,
  });
  await legacy.table("ingredient_price_history").add({
    id: "iph1",
    ingredientId: "ing1",
    priceKrwPerGram: 3,
    recordedAt: "2026-07-01T00:00:00.000Z",
  });
  await legacy.table("recipe_versions").add({
    id: "rv1",
    recipeId: "r1",
    versionNo: 1,
    yieldGram: 1000,
    lines: [{ ingredientId: "ing1", quantityGram: 100 }],
    createdAt: "2026-07-01T00:00:00.000Z",
  });
  await legacy.table("suppliers").add({ id: "sup1", name: "유제품상" });
  await legacy.table("recipe_categories").add({ id: "cat1", label: "젤라또" });
  await legacy.table("ingredient_categories").add({ id: "icat1", label: "유제품" });
  await legacy.table("package_units").add({ id: "pu1", label: "1kg 팩", gramsPerUnit: 1000 });
  await legacy.table("daily_checklist").add({
    id: "dc1",
    date: "2026-07-01",
    note: "구버전 메모",
    isDone: true,
  });
  legacy.close();
}

describe("GelatoDB v1→v2 마이그레이션", () => {
  it("ingredients: currentPriceKrwPerGram를 packagePrice/packageAmount/pricePerGram으로 변환한다", async () => {
    dbName = "migrate-ingredients";
    await seedV1(dbName);

    const db = new GelatoDB(dbName);
    await db.open();
    expect(db.verno).toBe(3);

    const ingredient = await db.ingredients.get("ing1" as never);
    expect(ingredient).toMatchObject({
      packagePrice: 3,
      packageAmount: 1,
      pricePerGram: 3,
      stockCount: 0,
      stockUnit: "g",
      categoryIds: [],
    });
    expect(ingredient).not.toHaveProperty("currentPriceKrwPerGram");
    expect(ingredient).not.toHaveProperty("packageUnitId");
    expect(ingredient).not.toHaveProperty("categoryId");
    db.close();
  });

  it("recipe_versions: yieldGram/lines를 snapshotJson으로 직렬화한다", async () => {
    dbName = "migrate-recipe-versions";
    await seedV1(dbName);

    const db = new GelatoDB(dbName);
    await db.open();

    const version = await db.recipe_versions.get("rv1" as never);
    expect(version).not.toHaveProperty("yieldGram");
    expect(version).not.toHaveProperty("lines");
    const snapshot = JSON.parse(version?.snapshotJson ?? "{}");
    expect(snapshot).toEqual({
      batchSize: 1000,
      lines: [{ ingredientId: "ing1", quantityGram: 100 }],
    });
    db.close();
  });

  it("recipes/suppliers/카테고리류에 새 필드를 채운다", async () => {
    dbName = "migrate-labels";
    await seedV1(dbName);

    const db = new GelatoDB(dbName);
    await db.open();

    expect(await db.recipes.get("r1" as never)).toMatchObject({ batchSize: 1000, memo: "" });
    expect(await db.suppliers.get("sup1" as never)).toMatchObject({ contact: "", memo: "" });
    expect(await db.recipe_categories.get("cat1" as never)).toMatchObject({
      name: "젤라또",
      colorHex: "#9ca3af",
    });
    expect(await db.package_units.get("pu1" as never)).toMatchObject({
      name: "1kg 팩",
      colorHex: "#9ca3af",
    });
    expect(await db.package_units.get("pu1" as never)).not.toHaveProperty("gramsPerUnit");
    db.close();
  });

  it("daily_checklist: 구조 비호환이라 테이블을 비운다 (옵션 A)", async () => {
    dbName = "migrate-checklist";
    await seedV1(dbName);

    const db = new GelatoDB(dbName);
    await db.open();

    expect(await db.daily_checklist.count()).toBe(0);
    db.close();
  });

  it("v3: 값이 있는 categoryId는 categoryIds=[id]로 변환한다 [F6]", async () => {
    dbName = "migrate-category-multi";
    const legacy = new Dexie(dbName);
    legacy.version(1).stores(V1_STORES);
    await legacy.open();
    await legacy.table("recipes").add({
      id: "r9",
      name: "딸기",
      categoryId: "cat1",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    });
    await legacy.table("ingredients").add({
      id: "ing9",
      name: "딸기 퓨레",
      categoryId: "icat1",
      supplierId: null,
      packageUnitId: null,
      currentPriceKrwPerGram: 5,
    });
    legacy.close();

    const db = new GelatoDB(dbName);
    await db.open();

    const recipe = await db.recipes.get("r9" as never);
    expect(recipe?.categoryIds).toEqual(["cat1"]);
    expect(recipe).not.toHaveProperty("categoryId");
    const ingredient = await db.ingredients.get("ing9" as never);
    expect(ingredient?.categoryIds).toEqual(["icat1"]);
    expect(ingredient).not.toHaveProperty("categoryId");
    db.close();
  });
});
