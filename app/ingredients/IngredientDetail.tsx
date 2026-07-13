"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIngredientStore } from "@/store/ingredientStore";
import { useSupplierStore } from "@/store/supplierStore";
import { useIngredientCategoryStore } from "@/store/labelStores";
import type { IngredientId } from "@/lib/domain/ids";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
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

  const infoRows: { label: string; value: string }[] = [
    {
      label: "현재가",
      value: `${ingredient.packagePrice.toLocaleString()}원 / ${ingredient.packageAmount.toLocaleString()}g`,
    },
    { label: "기준(g)", value: `${ingredient.packageAmount.toLocaleString()} g` },
    {
      label: "재고",
      value: `${ingredient.stockCount.toLocaleString()}${ingredient.stockUnit}`,
    },
    { label: "공급업체", value: supplier?.name ?? "-" },
  ];

  return (
    <main>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="뒤로가기"
          onClick={() => router.back()}
          className="shrink-0 border-none px-1 py-1 text-sm text-gray-600 hover:bg-transparent hover:text-gray-900"
        >
          ← 뒤로
        </button>
        <Link
          href={`/ingredients/${ingredient.id}/edit`}
          className="inline-flex shrink-0 items-center rounded-full bg-ingredient-soft px-4 py-2 text-sm font-semibold text-ingredient hover:brightness-95"
        >
          수정
        </Link>
      </div>

      <header className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{ingredient.name}</h1>
        {category && <Badge label={category.name} colorHex={category.colorHex} />}
      </header>

      <Card accent="ingredient" className="divide-y divide-amber-100 p-0">
        {infoRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-gray-500">{row.label}</span>
            <span className="font-semibold text-gray-900">{row.value}</span>
          </div>
        ))}
      </Card>

      <div className="space-y-3">
        <SectionTitle
          tone="ingredient"
          action={
            <Button
              type="button"
              tone="ingredient"
              variant="soft"
              onClick={() => setPriceModalOpen(true)}
            >
              + 가격 등록
            </Button>
          }
        >
          가격 변동 이력
        </SectionTitle>
        <PriceHistory history={priceHistory} bare />
      </div>

      <Button
        type="button"
        tone="danger"
        variant="soft"
        fullWidth
        onClick={() => setPendingDelete(true)}
      >
        재료 삭제
      </Button>

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
