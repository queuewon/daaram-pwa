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
      <PageHeader title="레시피 카테고리" tone="brand" back />
      <LabelManager
        tone="brand"
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
