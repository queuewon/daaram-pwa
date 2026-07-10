import Dexie, { type EntityTable, type Transaction } from "dexie";
import type {
  DailyChecklist,
  Ingredient,
  IngredientCategory,
  IngredientPriceHistory,
  PackageUnit,
  Recipe,
  RecipeCategory,
  RecipeVersion,
  Supplier,
} from "../domain/entities";

// v1→v2 마이그레이션에서 라벨/포장단위에 채울 임시 중립색 (실데이터 없어 근거 있는 기본값이 없음).
const MIGRATION_DEFAULT_COLOR = "#9ca3af";

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toStringOr(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

// 각 테이블을 v1 형태에서 v2 형태로 변환한다. 기존 데이터가 있을 때만 실행된다. [F6]
async function upgradeToV2(tx: Transaction): Promise<void> {
  await tx
    .table("recipes")
    .toCollection()
    .modify((row: Record<string, unknown>) => {
      row.batchSize = 1000;
      row.memo = "";
    });

  await tx
    .table("ingredients")
    .toCollection()
    .modify((row: Record<string, unknown>) => {
      const legacyPrice = toNumber(row.currentPriceKrwPerGram, 0);
      row.packageAmount = 1;
      row.packagePrice = legacyPrice;
      row.pricePerGram = legacyPrice;
      row.stockCount = 0;
      row.stockUnit = "g";
      delete row.currentPriceKrwPerGram;
      delete row.packageUnitId;
    });

  await tx
    .table("ingredient_price_history")
    .toCollection()
    .modify((row: Record<string, unknown>) => {
      row.packageAmount = 1;
      row.packagePrice = toNumber(row.priceKrwPerGram, 0);
      delete row.priceKrwPerGram;
    });

  await tx
    .table("recipe_versions")
    .toCollection()
    .modify((row: Record<string, unknown>) => {
      const batchSize = toNumber(row.yieldGram, 1000);
      const lines = Array.isArray(row.lines) ? row.lines : [];
      row.snapshotJson = JSON.stringify({ batchSize, lines });
      delete row.yieldGram;
      delete row.lines;
    });

  await tx
    .table("suppliers")
    .toCollection()
    .modify((row: Record<string, unknown>) => {
      row.contact = "";
      row.memo = "";
    });

  for (const tableName of ["recipe_categories", "ingredient_categories"]) {
    await tx
      .table(tableName)
      .toCollection()
      .modify((row: Record<string, unknown>) => {
        row.name = toStringOr(row.label, "");
        row.colorHex = MIGRATION_DEFAULT_COLOR;
        delete row.label;
      });
  }

  await tx
    .table("package_units")
    .toCollection()
    .modify((row: Record<string, unknown>) => {
      row.name = toStringOr(row.label, "");
      row.colorHex = MIGRATION_DEFAULT_COLOR;
      delete row.label;
      delete row.gramsPerUnit;
    });

  // DailyChecklist는 v1(note/isDone)과 v2(recipeId/batchSize/status)가 구조 비호환이라
  // 보존할 수 있는 매핑이 없다 — 옵션 A 결정에 따라 테이블을 비운다.
  await tx.table("daily_checklist").clear();
}

export class GelatoDB extends Dexie {
  recipes!: EntityTable<Recipe, "id">;
  recipe_versions!: EntityTable<RecipeVersion, "id">;
  ingredients!: EntityTable<Ingredient, "id">;
  ingredient_price_history!: EntityTable<IngredientPriceHistory, "id">;
  suppliers!: EntityTable<Supplier, "id">;
  daily_checklist!: EntityTable<DailyChecklist, "id">;
  recipe_categories!: EntityTable<RecipeCategory, "id">;
  ingredient_categories!: EntityTable<IngredientCategory, "id">;
  package_units!: EntityTable<PackageUnit, "id">;

  constructor(name = "gelato-pwa") {
    super(name);

    this.version(1).stores({
      recipes: "id, categoryId",
      recipe_versions: "id, recipeId",
      ingredients: "id, categoryId, supplierId, packageUnitId",
      ingredient_price_history: "id, ingredientId, recordedAt",
      suppliers: "id",
      daily_checklist: "id, date",
      recipe_categories: "id",
      ingredient_categories: "id",
      package_units: "id",
    });

    this.version(2)
      .stores({
        recipes: "id, categoryId",
        recipe_versions: "id, recipeId",
        ingredients: "id, categoryId, supplierId",
        ingredient_price_history: "id, ingredientId, recordedAt",
        suppliers: "id",
        daily_checklist: "id, date, recipeId",
        recipe_categories: "id",
        ingredient_categories: "id",
        package_units: "id",
      })
      .upgrade(upgradeToV2);
  }
}

export const db = new GelatoDB();
