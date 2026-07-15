"use client";

import { useEffect, useState } from "react";
import type { Result } from "@/lib/domain/result";
import type { SaveLabelError } from "@/store/createLabelStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TONE_SOFT_BORDER, TONE_TEXT } from "@/components/ui/theme";
import { ColorSwatchPicker } from "./ColorSwatchPicker";

const DEFAULT_COLOR = "#9ca3af";

export type LabelTone = "brand" | "ingredient" | "data";

interface Label<TId> {
  id: TId;
  name: string;
  colorHex: string;
}

interface LabelManagerProps<L extends Label<TId>, TId extends string> {
  tone: LabelTone;
  registeredTitle: string;
  newTitle: string;
  namePlaceholder: string;
  items: L[];
  loadItems: () => void;
  saveLabel: (input: { id: TId | null; form: unknown }) => Promise<Result<L, SaveLabelError>>;
  removeLabel: (id: TId) => void;
}

export default function LabelManager<L extends Label<TId>, TId extends string>({
  tone,
  registeredTitle,
  newTitle,
  namePlaceholder,
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
    <div className="space-y-6">
      <Card accent={tone} className="space-y-4">
        <SectionTitle tone={tone}>{registeredTitle}</SectionTitle>

        {items.length === 0 ? (
          <EmptyState title="등록된 항목이 없습니다" subtitle="아래에서 새로 추가하세요" />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <LabelRow
                key={item.id}
                tone={tone}
                item={item}
                onSave={(form) => saveLabel({ id: item.id, form })}
                onRemove={() => setPendingDelete(item)}
              />
            ))}
          </ul>
        )}
      </Card>

      <Card accent={tone} className="space-y-4">
        <SectionTitle tone={tone}>{newTitle}</SectionTitle>
        <AddLabelRow
          tone={tone}
          namePlaceholder={namePlaceholder}
          onSave={(form) => saveLabel({ id: null, form })}
        />
      </Card>

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
    </div>
  );
}

interface LabelRowProps {
  tone: LabelTone;
  item: { id: string; name: string; colorHex: string };
  onSave: (form: unknown) => Promise<Result<unknown, SaveLabelError>>;
  onRemove: () => void;
}

function LabelRow({ tone, item, onSave, onRemove }: LabelRowProps) {
  const [name, setName] = useState(item.name);
  const [colorHex, setColorHex] = useState(item.colorHex);
  const [editorOpen, setEditorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setErrorMessage(null);
    setIsSaving(true);
    const result = await onSave({ name, colorHex });
    setIsSaving(false);
    if (!result.ok) {
      setErrorMessage("저장에 실패했습니다 (이름 필수).");
      return;
    }
    setEditorOpen(false);
  }

  return (
    <li className={`space-y-3 rounded-2xl border bg-white p-3 ${TONE_SOFT_BORDER[tone]}`}>
      <div className="flex items-center gap-3">
        <Badge label={name || item.name} colorHex={colorHex} />
        <button
          type="button"
          onClick={() => setEditorOpen((open) => !open)}
          className="border-none px-0 text-sm text-gray-500 hover:bg-transparent hover:text-gray-800"
        >
          색상 변경
        </button>
        <div className="ml-auto">
          <Button type="button" tone="danger" variant="soft" onClick={onRemove}>
            삭제
          </Button>
        </div>
      </div>

      {editorOpen && (
        <div className="space-y-3 border-t border-gray-100 pt-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="이름"
            className="w-full"
          />
          <ColorSwatchPicker value={colorHex} onChange={setColorHex} />
          {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}
          <Button type="button" tone={tone} variant="soft" onClick={handleSave} disabled={isSaving}>
            저장
          </Button>
        </div>
      )}
    </li>
  );
}

interface AddLabelRowProps {
  tone: LabelTone;
  namePlaceholder: string;
  onSave: (form: unknown) => Promise<Result<unknown, SaveLabelError>>;
}

function AddLabelRow({ tone, namePlaceholder, onSave }: AddLabelRowProps) {
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
    <div className="space-y-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={namePlaceholder}
        aria-label="새 이름"
        className="w-full"
      />
      <div className="space-y-2">
        <p className={`text-sm font-semibold ${TONE_TEXT[tone]}`}>라벨 색상</p>
        <ColorSwatchPicker value={colorHex} onChange={setColorHex} />
      </div>
      {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}
      <Button
        type="button"
        tone={tone}
        variant="pale"
        fullWidth
        onClick={handleAdd}
        disabled={isSaving}
      >
        추가하기
      </Button>
    </div>
  );
}
