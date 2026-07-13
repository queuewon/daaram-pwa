"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useChecklistStore } from "@/store/checklistStore";
import type { Recipe } from "@/lib/domain/entities";

interface AddChecklistItemModalProps {
  recipes: Recipe[];
  date: string;
  onClose: () => void;
}

export default function AddChecklistItemModal({
  recipes,
  date,
  onClose,
}: AddChecklistItemModalProps) {
  const addChecklistItem = useChecklistStore((s) => s.addChecklistItem);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [batchSize, setBatchSize] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSelectRecipe(recipe: Recipe) {
    setSelectedRecipe(recipe);
    setBatchSize(recipe.batchSize);
    setErrorMessage(null);
  }

  async function handleConfirm() {
    if (!selectedRecipe) return;
    setErrorMessage(null);
    setIsSaving(true);
    const result = await addChecklistItem({ recipeId: selectedRecipe.id, date, batchSize });
    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage("입력값을 확인해 주세요 (배치량 0 초과).");
      return;
    }
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-checklist-item-title"
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      <header className="flex items-center justify-between gap-2 border-b border-gray-100 px-6 py-5">
        <h1 id="add-checklist-item-title" className="text-2xl font-bold text-data">
          {selectedRecipe ? "배치량 설정" : "레시피 선택"}
        </h1>
        <button
          type="button"
          onClick={onClose}
          className="border-none px-1 text-base text-gray-600 hover:bg-transparent hover:text-gray-900"
        >
          닫기
        </button>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto p-6">
        {!selectedRecipe ? (
          recipes.length === 0 ? (
            <p className="text-sm text-gray-500">
              등록된 레시피가 없습니다. 먼저 레시피를 추가해 주세요.
            </p>
          ) : (
            <ul className="space-y-3">
              {recipes.map((recipe) => (
                <li key={recipe.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectRecipe(recipe)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-white p-4 text-left shadow-sm hover:brightness-95"
                  >
                    <span className="font-bold text-gray-900">{recipe.name}</span>
                    <span className="shrink-0 text-sm text-gray-500">
                      기본 {recipe.batchSize.toLocaleString()}g
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="space-y-4">
            <p className="font-bold text-gray-900">{selectedRecipe.name}</p>
            <div className="space-y-1">
              <label htmlFor="add-checklist-batch-size">배치량(g)</label>
              <input
                id="add-checklist-batch-size"
                type="number"
                className="w-full"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
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
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                tone="neutral"
                variant="outline"
                onClick={() => setSelectedRecipe(null)}
              >
                다른 레시피 선택
              </Button>
              <Button
                type="button"
                tone="data"
                variant="solid"
                onClick={handleConfirm}
                disabled={isSaving}
              >
                추가
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
