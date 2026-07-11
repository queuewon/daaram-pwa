"use client";

import { useEffect, useMemo, useState } from "react";
import { useChecklistStore } from "@/store/checklistStore";
import { useRecipeStore } from "@/store/recipeStore";
import { calculateChecklistProgress } from "@/lib/domain/checklistProgress";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { DailyChecklist, DailyChecklistStatus } from "@/lib/domain/entities";
import type { RecipeId } from "@/lib/domain/ids";

const STATUS_LABEL: Record<DailyChecklistStatus, string> = {
  pending: "대기",
  in_progress: "진행중",
  done: "완료",
};

function todayDateString(): string {
  return new Date().toLocaleDateString("sv-SE");
}

export default function ChecklistPage() {
  const [date, setDate] = useState(todayDateString);
  const [recipeId, setRecipeId] = useState<RecipeId | "">("");
  const [batchSize, setBatchSize] = useState(1000);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DailyChecklist | null>(null);

  const items = useChecklistStore((s) => s.items);
  const loadByDate = useChecklistStore((s) => s.loadByDate);
  const addChecklistItem = useChecklistStore((s) => s.addChecklistItem);
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

  async function handleAdd() {
    setErrorMessage(null);
    const result = await addChecklistItem({ recipeId, date, batchSize });
    if (!result.ok) {
      setErrorMessage("입력값을 확인해 주세요 (레시피 선택, 배치량 0 초과).");
      return;
    }
    setBatchSize(1000);
  }

  return (
    <main>
      <PageHeader title="오늘 생산 체크리스트" />

      <div>
        <label htmlFor="checklist-date">날짜</label>
        <input
          id="checklist-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <p className="font-semibold">
        {progress.doneCount}/{progress.total} 완료 · {Math.round(progress.ratio * 100)}%
      </p>

      <section>
        <h2>항목 추가</h2>
        <div className="flex items-center gap-2">
          <select value={recipeId} onChange={(e) => setRecipeId(e.target.value as RecipeId | "")}>
            <option value="">레시피 선택</option>
            {recipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="w-24"
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
          />
          <span>g</span>
          <button type="button" onClick={handleAdd}>
            추가
          </button>
        </div>
        {errorMessage && (
          <p
            role="alert"
            className="rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700"
          >
            {errorMessage}
          </p>
        )}
      </section>

      {items.length === 0 ? (
        <EmptyState
          title="오늘 등록된 생산 항목이 없습니다"
          subtitle="위에서 레시피를 선택해 추가해 보세요"
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card accent="data" className="flex items-center justify-between gap-2">
                <span>
                  {recipeMap.get(item.recipeId)?.name ?? item.recipeId} · {item.batchSize}g
                </span>
                <button type="button" onClick={() => cycleStatus(item.id)}>
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
