"use client";

import { useRecipeCategoryStore } from "@/store/labelStores";
import { PageHeader } from "@/components/ui/PageHeader";
import LabelManager from "../../LabelManager";

export default function RecipeCategoriesPage() {
  const items = useRecipeCategoryStore((s) => s.items);
  const loadItems = useRecipeCategoryStore((s) => s.loadItems);
  const saveLabel = useRecipeCategoryStore((s) => s.saveLabel);
  const removeLabel = useRecipeCategoryStore((s) => s.removeLabel);

  return (
    <main>
      <PageHeader title="레시피 카테고리" />
      <LabelManager
        items={items}
        loadItems={loadItems}
        saveLabel={saveLabel}
        removeLabel={removeLabel}
      />
    </main>
  );
}
