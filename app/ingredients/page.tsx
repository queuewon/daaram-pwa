"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useIngredientStore } from "@/store/ingredientStore";
import { useSupplierStore } from "@/store/supplierStore";

export default function IngredientsPage() {
  const ingredients = useIngredientStore((s) => s.ingredients);
  const loadIngredients = useIngredientStore((s) => s.loadIngredients);
  const removeIngredient = useIngredientStore((s) => s.removeIngredient);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const loadSuppliers = useSupplierStore((s) => s.loadSuppliers);

  useEffect(() => {
    loadIngredients();
    loadSuppliers();
  }, [loadIngredients, loadSuppliers]);

  const supplierMap = useMemo(() => new Map(suppliers.map((s) => [s.id, s])), [suppliers]);

  return (
    <main>
      <h1>재료</h1>
      <Link
        href="/ingredients/new"
        className="inline-block rounded border border-gray-400 px-3 py-1 hover:bg-gray-100"
      >
        새 재료
      </Link>
      <ul className="divide-y divide-gray-200 border border-gray-200 rounded">
        {ingredients.map((ingredient) => (
          <li key={ingredient.id} className="flex items-center justify-between gap-2 px-3 py-2">
            <Link href={`/ingredients/${ingredient.id}`} className="underline">
              {ingredient.name}
            </Link>
            <span className="text-sm text-gray-500">
              {ingredient.pricePerGram.toLocaleString()}원/g · 재고 {ingredient.stockCount}
              {ingredient.stockUnit}
              {ingredient.supplierId && supplierMap.get(ingredient.supplierId)
                ? ` · ${supplierMap.get(ingredient.supplierId)?.name}`
                : ""}
            </span>
            <button type="button" onClick={() => removeIngredient(ingredient.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
