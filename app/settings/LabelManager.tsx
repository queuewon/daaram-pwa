"use client";

import { useEffect, useState } from "react";
import type { Result } from "@/lib/domain/result";
import type { SaveLabelError } from "@/store/createLabelStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ColorSwatchPicker } from "./ColorSwatchPicker";

const DEFAULT_COLOR = "#9ca3af";

interface Label<TId> {
  id: TId;
  name: string;
  colorHex: string;
}

interface LabelManagerProps<L extends Label<TId>, TId extends string> {
  title?: string;
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
  const [pendingDelete, setPendingDelete] = useState<L | null>(null);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return (
    <section>
      {title && <h2>{title}</h2>}

      {items.length === 0 ? (
        <EmptyState title="아직 등록된 항목이 없습니다" subtitle="아래에서 새로 추가해 보세요" />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <LabelRow
              key={item.id}
              item={item}
              onSave={(form) => saveLabel({ id: item.id, form })}
              onRemove={() => setPendingDelete(item)}
            />
          ))}
        </ul>
      )}

      <AddLabelRow onSave={(form) => saveLabel({ id: null, form })} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="항목 삭제"
        description={`"${pendingDelete?.name ?? ""}" 항목을 삭제하시겠습니까? 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          if (pendingDelete) removeLabel(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
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
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
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
    <li>
      <Card accent="neutral" className="space-y-2">
        <div className="flex items-center gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
          <Badge label={name || item.name} colorHex={colorHex} />
          <button type="button" onClick={() => setColorPickerOpen((open) => !open)}>
            색상 변경
          </button>
          <button type="button" onClick={handleSave} disabled={isSaving}>
            저장
          </button>
          <button type="button" onClick={onRemove}>
            삭제
          </button>
        </div>
        {colorPickerOpen && <ColorSwatchPicker value={colorHex} onChange={setColorHex} />}
        {errorMessage && <span className="text-sm text-red-700">{errorMessage}</span>}
      </Card>
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
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="새 이름"
          className="flex-1"
        />
        <button type="button" onClick={handleAdd} disabled={isSaving}>
          추가
        </button>
      </div>
      <ColorSwatchPicker value={colorHex} onChange={setColorHex} />
      {errorMessage && <span className="text-sm text-red-700">{errorMessage}</span>}
    </div>
  );
}
