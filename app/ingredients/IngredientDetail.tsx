"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIngredientStore } from "@/store/ingredientStore";
import { useSupplierStore } from "@/store/supplierStore";
import { useIngredientCategoryStore } from "@/store/labelStores";
import type { IngredientId } from "@/lib/domain/ids";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import PriceHistory from "./PriceHistory";
import PriceEntryModal from "./PriceEntryModal";

interface IngredientDetailProps {
  ingredientId: IngredientId;
}

export default function IngredientDetail({ ingredientId }: IngredientDetailProps) {
  const router = useRouter();
  const ingredients = useIngredientStore((s) => s.ingredients);
  const priceHistory = useIngredientStore((s) => s.priceHistory);
  const loadIngredients = useIngredientStore((s) => s.loadIngredients);
  const loadPriceHistory = useIngredientStore((s) => s.loadPriceHistory);
  const removeIngredient = useIngredientStore((s) => s.removeIngredient);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const loadSuppliers = useSupplierStore((s) => s.loadSuppliers);
  const ingredientCategories = useIngredientCategoryStore((s) => s.items);
  const loadIngredientCategories = useIngredientCategoryStore((s) => s.loadItems);

  const [pendingDelete, setPendingDelete] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);

  useEffect(() => {
    loadIngredients();
    loadPriceHistory(ingredientId);
    loadSuppliers();
    loadIngredientCategories();
  }, [ingredientId, loadIngredients, loadPriceHistory, loadSuppliers, loadIngredientCategories]);

  const ingredient = ingredients.find((i) => i.id === ingredientId);

  if (!ingredient) {
    return (
      <main>
        <p>불러오는 중...</p>
      </main>
    );
  }

  const category = ingredient.categoryId
    ? ingredientCategories.find((c) => c.id === ingredient.categoryId)
    : undefined;
  const supplier = ingredient.supplierId
    ? suppliers.find((s) => s.id === ingredient.supplierId)
    : undefined;

  async function handleDelete() {
    await removeIngredient(ingredientId);
    setPendingDelete(false);
    router.push("/ingredients");
  }

  return (
    <main>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="뒤로가기"
          onClick={() => router.back()}
          className="shrink-0 border-none px-1 py-1 text-sm text-gray-600 hover:bg-transparent hover:text-gray-900"
        >
          ← 뒤로가기
        </button>
        <Link href={`/ingredients/${ingredient.id}/edit`} className="shrink-0">
          수정
        </Link>
      </div>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{ingredient.name}</h1>
        {category && <Badge label={category.name} colorHex={category.colorHex} />}
      </header>

      <section>
        <h2>정보</h2>
        <table className="w-full border border-gray-200 text-sm">
          <tbody className="divide-y divide-gray-200">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">현재가</th>
              <td className="px-3 py-2">{ingredient.pricePerGram.toLocaleString()}원/g</td>
            </tr>
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">기준(g)</th>
              <td className="px-3 py-2">{ingredient.packageAmount.toLocaleString()}g</td>
            </tr>
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">재고</th>
              <td className="px-3 py-2">
                {ingredient.stockCount.toLocaleString()}
                {ingredient.stockUnit}
              </td>
            </tr>
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">공급업체</th>
              <td className="px-3 py-2">{supplier?.name ?? "-"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <div className="flex items-center justify-between gap-2">
          <h2>가격 이력</h2>
          <button type="button" onClick={() => setPriceModalOpen(true)}>
            + 가격 등록
          </button>
        </div>
        <PriceHistory history={priceHistory} />
      </section>

      <button type="button" onClick={() => setPendingDelete(true)} className="text-danger">
        재료 삭제
      </button>

      {priceModalOpen && (
        <PriceEntryModal ingredient={ingredient} onClose={() => setPriceModalOpen(false)} />
      )}

      <ConfirmDialog
        open={pendingDelete}
        title="재료 삭제"
        description={`"${ingredient.name}" 재료를 삭제하시겠습니까? 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(false)}
      />
    </main>
  );
}
