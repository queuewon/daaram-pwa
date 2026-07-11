"use client";

import { useEffect, useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-checklist-item-title"
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 id="add-checklist-item-title" className="text-base font-semibold">
          메뉴 추가
        </h2>

        {!selectedRecipe ? (
          recipes.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              등록된 레시피가 없습니다. 먼저 레시피를 추가해 주세요.
            </p>
          ) : (
            <ul className="mt-4 max-h-80 divide-y divide-gray-200 overflow-y-auto rounded border border-gray-200">
              {recipes.map((recipe) => (
                <li key={recipe.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectRecipe(recipe)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                  >
                    <span>{recipe.name}</span>
                    <span className="text-sm text-gray-500">
                      기본 {recipe.batchSize.toLocaleString()}g
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="mt-4 space-y-3">
            <p className="font-medium">{selectedRecipe.name}</p>
            <div>
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
                className="rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700"
              >
                {errorMessage}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSelectedRecipe(null)}>
                다른 레시피 선택
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSaving}
                className="border-gray-900 bg-gray-900 text-white hover:bg-gray-800"
              >
                추가
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
