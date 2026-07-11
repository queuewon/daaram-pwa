"use client";

import { useEffect, useMemo, useState } from "react";
import { useChecklistStore } from "@/store/checklistStore";
import { useRecipeStore } from "@/store/recipeStore";
import { calculateChecklistProgress } from "@/lib/domain/checklistProgress";
import { formatDateWithWeekday, todayDateString } from "@/lib/domain/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import AddChecklistItemModal from "./AddChecklistItemModal";
import type { DailyChecklist, DailyChecklistStatus } from "@/lib/domain/entities";

const STATUS_LABEL: Record<DailyChecklistStatus, string> = {
  pending: "대기",
  in_progress: "진행중",
  done: "완료",
};

const STATUS_TEXT_CLASS: Record<DailyChecklistStatus, string> = {
  pending: "text-gray-600",
  in_progress: "text-data",
  done: "text-price-down",
};

export default function ChecklistPage() {
  const date = todayDateString();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DailyChecklist | null>(null);

  const items = useChecklistStore((s) => s.items);
  const loadByDate = useChecklistStore((s) => s.loadByDate);
  const cycleStatus = useChecklistStore((s) => s.cycleStatus);
  const removeChecklistItem = useChecklistStore((s) => s.removeChecklistItem);

  const recipes = useRecipeStore((s) => s.recipes);
  const loadRecipes = useRecipeStore((s) => s.loadRecipes);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  useEffect(() => {
    loadByDate(date);
  }, [date, loadByDate]);

  const recipeMap = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);
  const progress = useMemo(() => calculateChecklistProgress(items), [items]);

  return (
    <main>
      <PageHeader
        title="오늘 생산"
        subtitle={formatDateWithWeekday(date)}
        actions={
          <button
            type="button"
            aria-label="메뉴 추가"
            onClick={() => setAddModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-data text-lg leading-none text-data hover:bg-data-soft"
          >
            +
          </button>
        }
      />

      <Card accent="data" className="space-y-2">
        <p className="font-semibold">
          {progress.doneCount.toLocaleString()} / {progress.total.toLocaleString()} 완료
        </p>
        <div className="h-2 rounded-full bg-gray-100">
          <div className="h-2 rounded-full bg-data" style={{ width: `${progress.ratio * 100}%` }} />
        </div>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="비어있네. 일해" subtitle="오늘 만들 메뉴를 추가해보도록" />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card accent="data" className="flex items-center justify-between gap-2">
                <span>
                  {recipeMap.get(item.recipeId)?.name ?? item.recipeId} ·{" "}
                  {item.batchSize.toLocaleString()}g
                </span>
                <button
                  type="button"
                  onClick={() => cycleStatus(item.id)}
                  className={`rounded-full bg-gray-100 px-3 py-1 text-sm font-medium ${STATUS_TEXT_CLASS[item.status]}`}
                >
                  {STATUS_LABEL[item.status]}
                </button>
                <button type="button" onClick={() => setPendingDelete(item)}>
                  삭제
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {addModalOpen && (
        <AddChecklistItemModal
          recipes={recipes}
          date={date}
          onClose={() => setAddModalOpen(false)}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="생산 항목 삭제"
        description={`"${
          pendingDelete
            ? (recipeMap.get(pendingDelete.recipeId)?.name ?? pendingDelete.recipeId)
            : ""
        }" 항목을 삭제하시겠습니까? 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          if (pendingDelete) removeChecklistItem(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}
