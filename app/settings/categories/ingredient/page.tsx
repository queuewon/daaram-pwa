"use client";

import { useIngredientCategoryStore } from "@/store/labelStores";
import { PageHeader } from "@/components/ui/PageHeader";
import LabelManager from "../../LabelManager";

export default function IngredientCategoriesPage() {
  const items = useIngredientCategoryStore((s) => s.items);
  const loadItems = useIngredientCategoryStore((s) => s.loadItems);
  const saveLabel = useIngredientCategoryStore((s) => s.saveLabel);
  const removeLabel = useIngredientCategoryStore((s) => s.removeLabel);

  return (
    <main>
      <PageHeader title="재료 카테고리" tone="ingredient" back />
      <LabelManager
        tone="ingredient"
        registeredTitle="등록된 카테고리"
        newTitle="새 카테고리"
        namePlaceholder="카테고리 이름"
        items={items}
        loadItems={loadItems}
        saveLabel={saveLabel}
        removeLabel={removeLabel}
      />
    </main>
  );
}
