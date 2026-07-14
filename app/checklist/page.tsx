"use client";

import { useEffect, useMemo, useState } from "react";
import { useChecklistStore } from "@/store/checklistStore";
import { useRecipeStore } from "@/store/recipeStore";
import { calculateChecklistProgress } from "@/lib/domain/checklistProgress";
import { formatDateWithWeekday, todayDateString } from "@/lib/domain/date";
import { productionDates, yearMonthOf, type YearMonth } from "@/lib/domain/calendar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProductionCalendar } from "./ProductionCalendar";
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
  const today = todayDateString();

  const [selectedDate, setSelectedDate] = useState(today);
  const [viewYM, setViewYM] = useState<YearMonth>(() => yearMonthOf(today));
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DailyChecklist | null>(null);

  const items = useChecklistStore((s) => s.items);
  const monthItems = useChecklistStore((s) => s.monthItems);
  const loadByDate = useChecklistStore((s) => s.loadByDate);
  const loadMonth = useChecklistStore((s) => s.loadMonth);
  const cycleStatus = useChecklistStore((s) => s.cycleStatus);
  const removeChecklistItem = useChecklistStore((s) => s.removeChecklistItem);

  const recipes = useRecipeStore((s) => s.recipes);
  const loadRecipes = useRecipeStore((s) => s.loadRecipes);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  useEffect(() => {
    loadByDate(selectedDate);
  }, [selectedDate, loadByDate]);

  useEffect(() => {
    loadMonth(viewYM);
  }, [viewYM, loadMonth]);

  const recipeMap = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);
  const progress = useMemo(() => calculateChecklistProgress(items), [items]);
  const markedDates = useMemo(() => productionDates(monthItems), [monthItems]);

  const isToday = selectedDate === today;

  function goToday() {
    setSelectedDate(today);
    setViewYM(yearMonthOf(today));
  }

  return (
    <main>
      <PageHeader title="생산 달력" subtitle="날짜별 생산 기록을 관리" tone="data" />

      <ProductionCalendar
        viewYM={viewYM}
        selectedDate={selectedDate}
        today={today}
        markedDates={markedDates}
        onSelectDate={setSelectedDate}
        onChangeMonth={setViewYM}
      />

      <SectionTitle
        tone="data"
        action={
          !isToday && (
            <button
              type="button"
              onClick={goToday}
              className="border-none px-0 text-sm font-semibold text-data hover:bg-transparent"
            >
              오늘로
            </button>
          )
        }
      >
        {formatDateWithWeekday(selectedDate)}
      </SectionTitle>

      <Card accent="data" className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900">진행률</span>
          <span className="text-sm font-medium text-gray-500">
            {progress.doneCount.toLocaleString()} / {progress.total.toLocaleString()} 완료
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-data transition-all"
            style={{ width: `${progress.ratio * 100}%` }}
          />
        </div>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          title={isToday ? "비어있네. 일해" : "이 날은 생산 기록이 없어요"}
          subtitle="아래 버튼으로 메뉴를 추가해보세요"
          graphic
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card accent="data" className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">
                  <span className="font-medium text-gray-900">
                    {recipeMap.get(item.recipeId)?.name ?? "삭제된 레시피"}
                  </span>
                  <span className="text-gray-400"> · {item.batchSize.toLocaleString()}g</span>
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cycleStatus(item.id)}
                    className={`rounded-full border-transparent bg-gray-100 px-3 py-1 text-sm font-medium ${STATUS_TEXT_CLASS[item.status]}`}
                  >
                    {STATUS_LABEL[item.status]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(item)}
                    className="border-none px-1 text-sm text-gray-400 hover:bg-transparent hover:text-danger"
                  >
                    삭제
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div aria-hidden="true" className="h-16" />
      <div
        className="fixed inset-x-0 z-30 border-t border-gray-100 bg-white"
        style={{ bottom: "calc(var(--tab-bar-height) + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto max-w-2xl p-4">
          <Button
            type="button"
            tone="data"
            variant="solid"
            fullWidth
            onClick={() => setAddModalOpen(true)}
          >
            + 메뉴 추가
          </Button>
        </div>
      </div>

      {addModalOpen && (
        <AddChecklistItemModal
          recipes={recipes}
          date={selectedDate}
          onClose={() => {
            setAddModalOpen(false);
            loadMonth(viewYM);
          }}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="생산 항목 삭제"
        description={`"${
          pendingDelete ? (recipeMap.get(pendingDelete.recipeId)?.name ?? "삭제된 레시피") : ""
        }" 항목을 삭제하시겠습니까? 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          if (pendingDelete) removeChecklistItem(pendingDelete.id);
          setPendingDelete(null);
          loadMonth(viewYM);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}
