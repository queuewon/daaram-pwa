"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIngredientStore } from "@/store/ingredientStore";
import { useSupplierStore } from "@/store/supplierStore";
import type { IngredientPriceHistory } from "@/lib/domain/entities";
import type { IngredientId, SupplierId } from "@/lib/domain/ids";
import PriceHistory from "./PriceHistory";

interface IngredientEditorProps {
  ingredientId: IngredientId | null;
}

export default function IngredientEditor({ ingredientId }: IngredientEditorProps) {
  const ingredients = useIngredientStore((s) => s.ingredients);
  const priceHistory = useIngredientStore((s) => s.priceHistory);
  const loadIngredients = useIngredientStore((s) => s.loadIngredients);
  const loadPriceHistory = useIngredientStore((s) => s.loadPriceHistory);
  const loadSuppliers = useSupplierStore((s) => s.loadSuppliers);

  useEffect(() => {
    loadIngredients();
    loadSuppliers();
    if (ingredientId) loadPriceHistory(ingredientId);
  }, [ingredientId, loadIngredients, loadSuppliers, loadPriceHistory]);

  if (ingredientId === null) {
    return (
      <IngredientEditorForm
        ingredientId={null}
        initialSupplierId={null}
        initialPackagePrice={0}
        initialPackageAmount={1}
        initialStockCount={0}
        initialStockUnit="g"
        priceHistory={[]}
      />
    );
  }

  const ingredient = ingredients.find((i) => i.id === ingredientId);
  if (!ingredient) {
    return (
      <main>
        <p>불러오는 중...</p>
      </main>
    );
  }

  return (
    <IngredientEditorForm
      ingredientId={ingredientId}
      initialName={ingredient.name}
      initialSupplierId={ingredient.supplierId}
      initialPackagePrice={ingredient.packagePrice}
      initialPackageAmount={ingredient.packageAmount}
      initialStockCount={ingredient.stockCount}
      initialStockUnit={ingredient.stockUnit}
      priceHistory={priceHistory}
    />
  );
}

interface IngredientEditorFormProps {
  ingredientId: IngredientId | null;
  initialName?: string;
  initialSupplierId: SupplierId | null;
  initialPackagePrice: number;
  initialPackageAmount: number;
  initialStockCount: number;
  initialStockUnit: string;
  priceHistory: IngredientPriceHistory[];
}

function IngredientEditorForm({
  ingredientId,
  initialName = "",
  initialSupplierId,
  initialPackagePrice,
  initialPackageAmount,
  initialStockCount,
  initialStockUnit,
  priceHistory,
}: IngredientEditorFormProps) {
  const router = useRouter();
  const saveIngredient = useIngredientStore((s) => s.saveIngredient);
  const suppliers = useSupplierStore((s) => s.suppliers);

  const [name, setName] = useState(initialName);
  const [supplierId, setSupplierId] = useState<SupplierId | "">(initialSupplierId ?? "");
  const [packagePrice, setPackagePrice] = useState(initialPackagePrice);
  const [packageAmount, setPackageAmount] = useState(initialPackageAmount);
  const [stockCount, setStockCount] = useState(initialStockCount);
  const [stockUnit, setStockUnit] = useState(initialStockUnit);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const pricePerGram = packageAmount > 0 ? packagePrice / packageAmount : 0;

  async function handleSave() {
    setErrorMessage(null);
    setIsSaving(true);

    const form = {
      name,
      supplierId: supplierId === "" ? null : supplierId,
      packagePrice,
      packageAmount,
      stockCount,
      stockUnit,
    };

    const result = await saveIngredient({ ingredientId, form });
    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage(
        result.error.type === "InvalidForm"
          ? "입력값을 확인해 주세요 (이름 필수, 포장가격/재고 0 이상, 포장수량 0 초과)."
          : result.error.type === "NotFound"
            ? "재료를 찾을 수 없습니다."
            : "저장된 재료 데이터가 손상되어 있습니다.",
      );
      return;
    }

    router.push(`/ingredients/${result.value.id}`);
  }

  return (
    <main>
      <h1>{ingredientId ? "재료 수정" : "새 재료"}</h1>

      <div>
        <label htmlFor="ingredient-name">이름</label>
        <input
          id="ingredient-name"
          className="w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="ingredient-supplier">공급업체</label>
        <select
          id="ingredient-supplier"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value as SupplierId | "")}
        >
          <option value="">공급업체 없음</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="ingredient-package-price">포장 가격(원)</label>
        <input
          id="ingredient-package-price"
          type="number"
          value={packagePrice}
          onChange={(e) => setPackagePrice(Number(e.target.value))}
        />
      </div>

      <div>
        <label htmlFor="ingredient-package-amount">포장 수량(g)</label>
        <input
          id="ingredient-package-amount"
          type="number"
          value={packageAmount}
          onChange={(e) => setPackageAmount(Number(e.target.value))}
        />
      </div>

      <p>g당 가격: {Number.isFinite(pricePerGram) ? pricePerGram.toLocaleString() : "-"}원</p>

      <div>
        <label htmlFor="ingredient-stock-count">재고</label>
        <input
          id="ingredient-stock-count"
          type="number"
          value={stockCount}
          onChange={(e) => setStockCount(Number(e.target.value))}
        />
      </div>

      <div>
        <label htmlFor="ingredient-stock-unit">재고 단위</label>
        <input
          id="ingredient-stock-unit"
          value={stockUnit}
          onChange={(e) => setStockUnit(e.target.value)}
        />
      </div>

      {errorMessage && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700">
          {errorMessage}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="border-gray-900 font-medium"
      >
        저장
      </button>

      {ingredientId && <PriceHistory history={priceHistory} />}
    </main>
  );
}
