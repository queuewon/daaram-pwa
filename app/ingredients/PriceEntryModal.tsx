"use client";

import { useEffect, useState } from "react";
import { useIngredientStore } from "@/store/ingredientStore";
import type { Ingredient } from "@/lib/domain/entities";

interface PriceEntryModalProps {
  ingredient: Ingredient;
  onClose: () => void;
}

export default function PriceEntryModal({ ingredient, onClose }: PriceEntryModalProps) {
  const saveIngredient = useIngredientStore((s) => s.saveIngredient);
  const [packagePrice, setPackagePrice] = useState<number>(ingredient.packagePrice);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit() {
    setErrorMessage(null);
    setIsSaving(true);

    const result = await saveIngredient({
      ingredientId: ingredient.id,
      form: {
        name: ingredient.name,
        categoryId: ingredient.categoryId,
        supplierId: ingredient.supplierId,
        packagePrice,
        packageAmount: ingredient.packageAmount,
        stockCount: ingredient.stockCount,
        stockUnit: ingredient.stockUnit,
      },
    });
    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage("가격을 확인해 주세요 (0 이상의 숫자).");
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-entry-title"
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 id="price-entry-title" className="text-base font-semibold">
          가격 등록
        </h2>
        <div className="mt-4">
          <label htmlFor="price-entry-package-price">통가격(원)</label>
          <input
            id="price-entry-package-price"
            type="number"
            className="w-full"
            value={packagePrice}
            onChange={(e) => setPackagePrice(Number(e.target.value))}
          />
        </div>
        {errorMessage && (
          <p
            role="alert"
            className="mt-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700"
          >
            {errorMessage}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="border-gray-900 bg-gray-900 text-white hover:bg-gray-800"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
