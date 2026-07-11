"use client";

import {
  useIngredientCategoryStore,
  usePackageUnitStore,
  useRecipeCategoryStore,
} from "@/store/labelStores";
import LabelManager from "./LabelManager";
import { PageHeader } from "@/components/ui/PageHeader";

export default function SettingsPage() {
  const recipeCategories = useRecipeCategoryStore((s) => s.items);
  const loadRecipeCategories = useRecipeCategoryStore((s) => s.loadItems);
  const saveRecipeCategory = useRecipeCategoryStore((s) => s.saveLabel);
  const removeRecipeCategory = useRecipeCategoryStore((s) => s.removeLabel);

  const ingredientCategories = useIngredientCategoryStore((s) => s.items);
  const loadIngredientCategories = useIngredientCategoryStore((s) => s.loadItems);
  const saveIngredientCategory = useIngredientCategoryStore((s) => s.saveLabel);
  const removeIngredientCategory = useIngredientCategoryStore((s) => s.removeLabel);

  const packageUnits = usePackageUnitStore((s) => s.items);
  const loadPackageUnits = usePackageUnitStore((s) => s.loadItems);
  const savePackageUnit = usePackageUnitStore((s) => s.saveLabel);
  const removePackageUnit = usePackageUnitStore((s) => s.removeLabel);

  return (
    <main>
      <PageHeader title="설정" />
      <LabelManager
        title="레시피 카테고리"
        items={recipeCategories}
        loadItems={loadRecipeCategories}
        saveLabel={saveRecipeCategory}
        removeLabel={removeRecipeCategory}
      />
      <LabelManager
        title="재료 카테고리"
        items={ingredientCategories}
        loadItems={loadIngredientCategories}
        saveLabel={saveIngredientCategory}
        removeLabel={removeIngredientCategory}
      />
      <LabelManager
        title="포장단위"
        items={packageUnits}
        loadItems={loadPackageUnits}
        saveLabel={savePackageUnit}
        removeLabel={removePackageUnit}
      />
    </main>
  );
}
