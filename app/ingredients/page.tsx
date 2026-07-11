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
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterChip } from "@/components/ui/FilterChip";
import { filterIngredients } from "@/lib/domain/ingredientFilter";
import type { Ingredient } from "@/lib/domain/entities";
import type { IngredientCategoryId } from "@/lib/domain/ids";

export default function IngredientsPage() {
  const ingredients = useIngredientStore((s) => s.ingredients);
  const loadIngredients = useIngredientStore((s) => s.loadIngredients);
  const removeIngredient = useIngredientStore((s) => s.removeIngredient);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const loadSuppliers = useSupplierStore((s) => s.loadSuppliers);
  const ingredientCategories = useIngredientCategoryStore((s) => s.items);
  const loadIngredientCategories = useIngredientCategoryStore((s) => s.loadItems);

  const [pendingDelete, setPendingDelete] = useState<Ingredient | null>(null);
  const [searchText, setSearchText] = useState("");
  const [categoryId, setCategoryId] = useState<IngredientCategoryId | null>(null);

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
  const filteredIngredients = useMemo(
    () => filterIngredients(ingredients, { searchText, categoryId }),
    [ingredients, searchText, categoryId],
  );

  return (
    <main>
      <PageHeader
        title="재료"
        actions={
          <Link
            href="/ingredients/new"
            aria-label="새 재료"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ingredient text-lg leading-none text-ingredient hover:bg-ingredient-soft"
          >
            +
          </Link>
        }
      />

      <SearchBar value={searchText} onChange={setSearchText} placeholder="재료 이름 검색" />

      <div className="flex gap-2 overflow-x-auto">
        <FilterChip label="전체" active={categoryId === null} onClick={() => setCategoryId(null)} />
        {ingredientCategories.map((category) => (
          <FilterChip
            key={category.id}
            label={category.name}
            active={categoryId === category.id}
            onClick={() => setCategoryId(category.id)}
          />
        ))}
      </div>

      {filteredIngredients.length === 0 ? (
        ingredients.length === 0 ? (
          <EmptyState title="아직 등록된 재료가 없습니다" subtitle="새 재료를 추가해 보세요" />
        ) : (
          <EmptyState
            title="조건에 맞는 재료가 없습니다"
            subtitle="검색어나 카테고리를 확인해 보세요"
          />
        )
      ) : (
        <ul className="space-y-3">
          {filteredIngredients.map((ingredient) => {
            const category = ingredient.categoryId
              ? categoryMap.get(ingredient.categoryId)
              : undefined;
            const supplierName = ingredient.supplierId
              ? supplierMap.get(ingredient.supplierId)?.name
              : undefined;
            return (
              <li key={ingredient.id}>
                <Card accent="ingredient" className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/ingredients/${ingredient.id}`}
                      className="flex items-center gap-2 font-bold"
                    >
                      {ingredient.name}
                      {category && <Badge label={category.name} colorHex={category.colorHex} />}
                    </Link>
                    <span aria-hidden="true" className="text-gray-300">
                      ›
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    현재가 {ingredient.pricePerGram.toLocaleString()}원/g · 기준{" "}
                    {ingredient.packageAmount.toLocaleString()}g
                  </p>
                  <div className="flex items-center justify-between gap-2 text-sm text-gray-500">
                    <span>
                      재고 {ingredient.stockCount.toLocaleString()}
                      {ingredient.stockUnit}
                      {supplierName ? ` · ${supplierName}` : ""}
                    </span>
                    <button type="button" onClick={() => setPendingDelete(ingredient)}>
                      삭제
                    </button>
                  </div>
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
