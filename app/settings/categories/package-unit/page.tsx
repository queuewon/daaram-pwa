"use client";

import { usePackageUnitStore } from "@/store/labelStores";
import { PageHeader } from "@/components/ui/PageHeader";
import LabelManager from "../../LabelManager";

export default function PackageUnitsPage() {
  const items = usePackageUnitStore((s) => s.items);
  const loadItems = usePackageUnitStore((s) => s.loadItems);
  const saveLabel = usePackageUnitStore((s) => s.saveLabel);
  const removeLabel = usePackageUnitStore((s) => s.removeLabel);

  return (
    <main>
      <PageHeader title="포장 단위" tone="data" back />
      <LabelManager
        tone="data"
        registeredTitle="등록된 단위"
        newTitle="새 단위"
        namePlaceholder="단위 이름 (예: 박스)"
        items={items}
        loadItems={loadItems}
        saveLabel={saveLabel}
        removeLabel={removeLabel}
      />
    </main>
  );
}
