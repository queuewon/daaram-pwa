"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useIngredientStore } from "@/store/ingredientStore";
import { useIngredientCategoryStore } from "@/store/labelStores";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterChip } from "@/components/ui/FilterChip";
import { filterIngredients } from "@/lib/domain/ingredientFilter";
import type { Ingredient } from "@/lib/domain/entities";
import type { IngredientCategoryId } from "@/lib/domain/ids";
import PriceEntryModal from "./PriceEntryModal";

export default function IngredientsPage() {
  const ingredients = useIngredientStore((s) => s.ingredients);
  const loadIngredients = useIngredientStore((s) => s.loadIngredients);
  const ingredientCategories = useIngredientCategoryStore((s) => s.items);
  const loadIngredientCategories = useIngredientCategoryStore((s) => s.loadItems);

  const [searchText, setSearchText] = useState("");
  const [categoryId, setCategoryId] = useState<IngredientCategoryId | null>(null);
  const [priceModalIngredient, setPriceModalIngredient] = useState<Ingredient | null>(null);

  useEffect(() => {
    loadIngredients();
    loadIngredientCategories();
  }, [loadIngredients, loadIngredientCategories]);

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
        subtitle="가격과 재고를 한눈에"
        tone="ingredient"
        actions={
          <Link
            href="/ingredients/new"
            aria-label="새 재료"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-ingredient text-2xl leading-none text-white shadow-sm hover:opacity-90"
          >
            +
          </Link>
        }
      />

      <SearchBar
        value={searchText}
        onChange={setSearchText}
        placeholder="재료 검색"
        tone="ingredient"
      />

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <FilterChip
          label="전체"
          tone="ingredient"
          active={categoryId === null}
          onClick={() => setCategoryId(null)}
        />
        {ingredientCategories.map((category) => (
          <FilterChip
            key={category.id}
            label={category.name}
            tone="ingredient"
            active={categoryId === category.id}
            onClick={() => setCategoryId(category.id)}
          />
        ))}
      </div>

      {filteredIngredients.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          {ingredients.length === 0 ? (
            <EmptyState title="재료가 없어요" subtitle="+ 버튼으로 추가해보세요" graphic />
          ) : (
            <EmptyState
              title="조건에 맞는 재료가 없어요"
              subtitle="검색어나 카테고리를 확인해 보세요"
            />
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredIngredients.map((ingredient) => {
            const categories = ingredient.categoryIds
              .map((id) => categoryMap.get(id))
              .filter((c): c is NonNullable<typeof c> => c !== undefined);
            return (
              <li key={ingredient.id}>
                <Card accent="ingredient" className="relative space-y-1.5">
                  <Link
                    href={`/ingredients/${ingredient.id}`}
                    aria-label={`${ingredient.name} 상세`}
                    className="absolute inset-0 z-0 rounded-2xl"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-bold text-gray-900">{ingredient.name}</p>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      {categories.map((c) => (
                        <Badge key={c.id} label={c.name} colorHex={c.colorHex} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      현재가 {ingredient.packagePrice.toLocaleString()}원/
                      {ingredient.packageAmount.toLocaleString()}g
                    </span>
                    <button
                      type="button"
                      onClick={() => setPriceModalIngredient(ingredient)}
                      className="relative z-10 rounded-full border-transparent bg-ingredient-soft px-2.5 py-0.5 text-xs font-semibold text-ingredient hover:brightness-95"
                    >
                      수정
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    기준: {ingredient.packageAmount.toLocaleString()}g
                  </p>
                  <p className="text-sm text-gray-500">
                    재고: {ingredient.stockCount.toLocaleString()}
                    {ingredient.stockUnit}
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {priceModalIngredient && (
        <PriceEntryModal
          ingredient={priceModalIngredient}
          onClose={() => setPriceModalIngredient(null)}
        />
      )}
    </main>
  );
}
