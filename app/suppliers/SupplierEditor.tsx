"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupplierStore } from "@/store/supplierStore";
import type { SupplierId } from "@/lib/domain/ids";

interface SupplierEditorProps {
  supplierId: SupplierId | null;
}

export default function SupplierEditor({ supplierId }: SupplierEditorProps) {
  const suppliers = useSupplierStore((s) => s.suppliers);
  const loadSuppliers = useSupplierStore((s) => s.loadSuppliers);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  if (supplierId === null) {
    return <SupplierEditorForm supplierId={null} initialName="" initialContact="" initialMemo="" />;
  }

  const supplier = suppliers.find((s) => s.id === supplierId);
  if (!supplier) {
    return (
      <main>
        <p>불러오는 중...</p>
      </main>
    );
  }

  return (
    <SupplierEditorForm
      supplierId={supplierId}
      initialName={supplier.name}
      initialContact={supplier.contact}
      initialMemo={supplier.memo}
    />
  );
}

interface SupplierEditorFormProps {
  supplierId: SupplierId | null;
  initialName: string;
  initialContact: string;
  initialMemo: string;
}

function SupplierEditorForm({
  supplierId,
  initialName,
  initialContact,
  initialMemo,
}: SupplierEditorFormProps) {
  const router = useRouter();
  const saveSupplier = useSupplierStore((s) => s.saveSupplier);

  const [name, setName] = useState(initialName);
  const [contact, setContact] = useState(initialContact);
  const [memo, setMemo] = useState(initialMemo);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setErrorMessage(null);
    setIsSaving(true);

    const result = await saveSupplier({ supplierId, form: { name, contact, memo } });
    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage(
        result.error.type === "InvalidForm"
          ? "이름을 입력해 주세요."
          : result.error.type === "NotFound"
            ? "공급업체를 찾을 수 없습니다."
            : "저장된 공급업체 데이터가 손상되어 있습니다.",
      );
      return;
    }

    router.push(`/suppliers/${result.value.id}`);
  }

  return (
    <main>
      <h1>{supplierId ? "공급업체 수정" : "새 공급업체"}</h1>

      <div>
        <label htmlFor="supplier-name">이름</label>
        <input
          id="supplier-name"
          className="w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="supplier-contact">연락처</label>
        <input
          id="supplier-contact"
          className="w-full"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="supplier-memo">메모</label>
        <textarea
          id="supplier-memo"
          className="w-full"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      {errorMessage && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700">
          {errorMessage}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="border-gray-900 font-medium"
      >
        저장
      </button>
    </main>
  );
}
