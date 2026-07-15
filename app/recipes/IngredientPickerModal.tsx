"use client";

import { useEffect, useMemo, useState } from "react";
import { useIngredientCategoryStore } from "@/store/labelStores";
import { Badge } from "@/components/ui/Badge";
import type { Ingredient } from "@/lib/domain/entities";
import type { IngredientId } from "@/lib/domain/ids";

interface IngredientPickerModalProps {
  ingredients: Ingredient[];
  onSelect: (ingredientId: IngredientId) => void;
  onClose: () => void;
}

export default function IngredientPickerModal({
  ingredients,
  onSelect,
  onClose,
}: IngredientPickerModalProps) {
  const categories = useIngredientCategoryStore((s) => s.items);
  const loadCategories = useIngredientCategoryStore((s) => s.loadItems);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return ingredients;
    return ingredients.filter((ingredient) => {
      const categoryMatch = ingredient.categoryIds.some((id) =>
        categoryMap.get(id)?.name.toLowerCase().includes(q),
      );
      return ingredient.name.toLowerCase().includes(q) || categoryMatch;
    });
  }, [ingredients, query, categoryMap]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ingredient-picker-title"
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      <header className="flex items-center justify-between gap-2 border-b border-gray-100 px-6 py-5">
        <h1 id="ingredient-picker-title" className="text-2xl font-bold text-brand">
          재료 선택
        </h1>
        <button
          type="button"
          onClick={onClose}
          className="border-none px-1 text-base text-gray-600 hover:bg-transparent hover:text-gray-900"
        >
          닫기
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto p-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="재료명 또는 카테고리 검색"
          aria-label="재료 검색"
          className="w-full rounded-2xl border border-pink-200 bg-white px-5 py-3.5 text-sm shadow-sm outline-none placeholder:text-gray-400 focus-visible:border-brand"
        />

        {filtered.length === 0 ? (
          <p className="pt-8 text-center text-sm text-gray-400">
            {ingredients.length === 0 ? "등록된 재료가 없습니다" : "검색 결과가 없습니다"}
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((ingredient) => {
              const categories = ingredient.categoryIds
                .map((id) => categoryMap.get(id))
                .filter((c): c is NonNullable<typeof c> => c !== undefined);
              return (
                <li key={ingredient.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(ingredient.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-pink-200 bg-white p-4 text-left shadow-sm hover:brightness-95"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-gray-900">{ingredient.name}</p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {ingredient.pricePerGram.toLocaleString()}원/g
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      {categories.map((c) => (
                        <Badge key={c.id} label={c.name} colorHex={c.colorHex} />
                      ))}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
