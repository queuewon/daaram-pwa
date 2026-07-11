"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useIngredientStore } from "@/store/ingredientStore";
import { useSupplierStore } from "@/store/supplierStore";
import { useIngredientCategoryStore } from "@/store/labelStores";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Ingredient } from "@/lib/domain/entities";

export default function IngredientsPage() {
  const ingredients = useIngredientStore((s) => s.ingredients);
  const loadIngredients = useIngredientStore((s) => s.loadIngredients);
  const removeIngredient = useIngredientStore((s) => s.removeIngredient);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const loadSuppliers = useSupplierStore((s) => s.loadSuppliers);
  const ingredientCategories = useIngredientCategoryStore((s) => s.items);
  const loadIngredientCategories = useIngredientCategoryStore((s) => s.loadItems);

  const [pendingDelete, setPendingDelete] = useState<Ingredient | null>(null);

  useEffect(() => {
    loadIngredients();
    loadSuppliers();
    loadIngredientCategories();
  }, [loadIngredients, loadSuppliers, loadIngredientCategories]);

  const supplierMap = useMemo(() => new Map(suppliers.map((s) => [s.id, s])), [suppliers]);
  const categoryMap = useMemo(
    () => new Map(ingredientCategories.map((c) => [c.id, c])),
    [ingredientCategories],
  );

  return (
    <main>
      <PageHeader
        title="재료"
        actions={
          <Link
            href="/ingredients/new"
            className="inline-block rounded border border-gray-400 px-3 py-1 hover:bg-gray-100"
          >
            새 재료
          </Link>
        }
      />

      {ingredients.length === 0 ? (
        <EmptyState title="아직 등록된 재료가 없습니다" subtitle="새 재료를 추가해 보세요" />
      ) : (
        <ul className="space-y-3">
          {ingredients.map((ingredient) => {
            const category = ingredient.categoryId
              ? categoryMap.get(ingredient.categoryId)
              : undefined;
            return (
              <li key={ingredient.id}>
                <Card accent="ingredient" className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link href={`/ingredients/${ingredient.id}`} className="underline">
                      {ingredient.name}
                    </Link>
                    {category && <Badge label={category.name} colorHex={category.colorHex} />}
                  </div>
                  <span className="text-sm text-gray-500">
                    {ingredient.pricePerGram.toLocaleString()}원/g · 재고 {ingredient.stockCount}
                    {ingredient.stockUnit}
                    {ingredient.supplierId && supplierMap.get(ingredient.supplierId)
                      ? ` · ${supplierMap.get(ingredient.supplierId)?.name}`
                      : ""}
                  </span>
                  <button type="button" onClick={() => setPendingDelete(ingredient)}>
                    삭제
                  </button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="재료 삭제"
        description={`"${pendingDelete?.name ?? ""}" 재료를 삭제하시겠습니까? 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          if (pendingDelete) removeIngredient(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}
