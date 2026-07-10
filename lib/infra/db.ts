import Dexie, { type EntityTable } from "dexie";
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

  constructor() {
    super("gelato-pwa");
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
  }
}

export const db = new GelatoDB();
