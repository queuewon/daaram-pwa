"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupplierStore } from "@/store/supplierStore";
import type { SupplierId } from "@/lib/domain/ids";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
  const removeSupplier = useSupplierStore((s) => s.removeSupplier);

  const [name, setName] = useState(initialName);
  const [contact, setContact] = useState(initialContact);
  const [memo, setMemo] = useState(initialMemo);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

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

    router.push("/suppliers");
  }

  async function handleDelete() {
    if (!supplierId) return;
    await removeSupplier(supplierId);
    setPendingDelete(false);
    router.push("/suppliers");
  }

  const fieldClass = "w-full border-amber-200 focus-visible:border-ingredient";
  const labelClass = "text-ingredient";

  return (
    <main>
      <PageHeader title={supplierId ? "공급업체 수정" : "새 공급업체"} tone="ingredient" back />

      <div className="space-y-1.5">
        <label htmlFor="supplier-name" className={labelClass}>
          업체명
        </label>
        <input
          id="supplier-name"
          className={fieldClass}
          placeholder="예: 한국유제품"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="supplier-contact" className={labelClass}>
          연락처 (선택)
        </label>
        <input
          id="supplier-contact"
          className={fieldClass}
          placeholder="010-0000-0000"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="supplier-memo" className={labelClass}>
          메모 (선택)
        </label>
        <textarea
          id="supplier-memo"
          className={`${fieldClass} min-h-24`}
          placeholder="메모"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger"
        >
          {errorMessage}
        </p>
      )}

      <Button
        type="button"
        tone="ingredient"
        variant="solid"
        fullWidth
        onClick={handleSave}
        disabled={isSaving}
      >
        저장
      </Button>

      {supplierId && (
        <Button
          type="button"
          tone="danger"
          variant="soft"
          fullWidth
          onClick={() => setPendingDelete(true)}
        >
          공급업체 삭제
        </Button>
      )}

      <ConfirmDialog
        open={pendingDelete}
        title="공급업체 삭제"
        description={`"${name}" 공급업체를 삭제하시겠습니까? 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(false)}
      />
    </main>
  );
}
