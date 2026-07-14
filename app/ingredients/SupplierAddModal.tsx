"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

interface SupplierFormValue {
  name: string;
  contact: string;
  memo: string;
}

interface SupplierAddModalProps {
  /** 저장 성공 시 true를 반환하면 모달이 닫힌다. */
  onSave: (form: SupplierFormValue) => Promise<boolean>;
  onClose: () => void;
}

export default function SupplierAddModal({ onSave, onClose }: SupplierAddModalProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSave() {
    if (name.trim() === "") {
      setError("업체명을 입력해 주세요.");
      return;
    }
    setError(null);
    setIsSaving(true);
    const ok = await onSave({ name: name.trim(), contact, memo });
    setIsSaving(false);
    if (!ok) setError("추가에 실패했습니다.");
  }

  const fieldClass = "w-full border-amber-200 focus-visible:border-ingredient";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-add-title"
        onClick={(e) => e.stopPropagation()}
        className="mx-auto w-full max-w-2xl space-y-4 rounded-t-3xl bg-white p-6 shadow-xl"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
      >
        <h2 id="supplier-add-title" className="text-lg font-bold text-ingredient">
          새 공급업체
        </h2>

        <div className="space-y-1.5">
          <label htmlFor="supplier-name" className="text-ingredient">
            업체명
          </label>
          <input
            id="supplier-name"
            autoFocus
            className={fieldClass}
            placeholder="예: 한국유제품"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="supplier-contact" className="text-ingredient">
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
          <label htmlFor="supplier-memo" className="text-ingredient">
            메모 (선택)
          </label>
          <textarea
            id="supplier-memo"
            className={fieldClass}
            placeholder="메모"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            tone="neutral"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            type="button"
            tone="ingredient"
            variant="solid"
            className="flex-[2]"
            onClick={handleSave}
            disabled={isSaving}
          >
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}
