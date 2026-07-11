"use client";

import { useEffect, useState } from "react";
import type { Result } from "@/lib/domain/result";
import type { SaveLabelError } from "@/store/createLabelStore";

const DEFAULT_COLOR = "#9ca3af";

interface Label<TId> {
  id: TId;
  name: string;
  colorHex: string;
}

interface LabelManagerProps<L extends Label<TId>, TId extends string> {
  title: string;
  items: L[];
  loadItems: () => void;
  saveLabel: (input: { id: TId | null; form: unknown }) => Promise<Result<L, SaveLabelError>>;
  removeLabel: (id: TId) => void;
}

export default function LabelManager<L extends Label<TId>, TId extends string>({
  title,
  items,
  loadItems,
  saveLabel,
  removeLabel,
}: LabelManagerProps<L, TId>) {
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return (
    <section>
      <h2>{title}</h2>
      <ul className="divide-y divide-gray-200 border border-gray-200 rounded">
        {items.map((item) => (
          <LabelRow
            key={item.id}
            item={item}
            onSave={(form) => saveLabel({ id: item.id, form })}
            onRemove={() => removeLabel(item.id)}
          />
        ))}
      </ul>
      <AddLabelRow onSave={(form) => saveLabel({ id: null, form })} />
    </section>
  );
}

interface LabelRowProps {
  item: { id: string; name: string; colorHex: string };
  onSave: (form: unknown) => Promise<Result<unknown, SaveLabelError>>;
  onRemove: () => void;
}

function LabelRow({ item, onSave, onRemove }: LabelRowProps) {
  const [name, setName] = useState(item.name);
  const [colorHex, setColorHex] = useState(item.colorHex);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setErrorMessage(null);
    setIsSaving(true);
    const result = await onSave({ name, colorHex });
    setIsSaving(false);
    if (!result.ok) {
      setErrorMessage("저장에 실패했습니다 (이름 필수).");
    }
  }

  return (
    <li className="flex items-center gap-2 px-3 py-2">
      <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
      <input
        type="color"
        value={colorHex}
        onChange={(e) => setColorHex(e.target.value)}
        aria-label="색상"
      />
      <button type="button" onClick={handleSave} disabled={isSaving}>
        저장
      </button>
      <button type="button" onClick={onRemove}>
        삭제
      </button>
      {errorMessage && <span className="text-sm text-red-700">{errorMessage}</span>}
    </li>
  );
}

interface AddLabelRowProps {
  onSave: (form: unknown) => Promise<Result<unknown, SaveLabelError>>;
}

function AddLabelRow({ onSave }: AddLabelRowProps) {
  const [name, setName] = useState("");
  const [colorHex, setColorHex] = useState(DEFAULT_COLOR);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleAdd() {
    setErrorMessage(null);
    setIsSaving(true);
    const result = await onSave({ name, colorHex });
    setIsSaving(false);
    if (!result.ok) {
      setErrorMessage("이름을 입력해 주세요.");
      return;
    }
    setName("");
    setColorHex(DEFAULT_COLOR);
  }

  return (
    <div className="flex items-center gap-2 pt-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="새 이름"
        className="flex-1"
      />
      <input
        type="color"
        value={colorHex}
        onChange={(e) => setColorHex(e.target.value)}
        aria-label="색상"
      />
      <button type="button" onClick={handleAdd} disabled={isSaving}>
        추가
      </button>
      {errorMessage && <span className="text-sm text-red-700">{errorMessage}</span>}
    </div>
  );
}
