"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  useIngredientCategoryStore,
  usePackageUnitStore,
  useRecipeCategoryStore,
} from "@/store/labelStores";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, type CardAccent } from "@/components/ui/Card";

interface CategoryEntry {
  href: string;
  title: string;
  count: number;
  accent: CardAccent;
}

export default function CategoriesPage() {
  const recipeCategories = useRecipeCategoryStore((s) => s.items);
  const loadRecipeCategories = useRecipeCategoryStore((s) => s.loadItems);
  const ingredientCategories = useIngredientCategoryStore((s) => s.items);
  const loadIngredientCategories = useIngredientCategoryStore((s) => s.loadItems);
  const packageUnits = usePackageUnitStore((s) => s.items);
  const loadPackageUnits = usePackageUnitStore((s) => s.loadItems);

  useEffect(() => {
    loadRecipeCategories();
    loadIngredientCategories();
    loadPackageUnits();
  }, [loadRecipeCategories, loadIngredientCategories, loadPackageUnits]);

  const entries: CategoryEntry[] = [
    {
      href: "/settings/categories/recipe",
      title: "레시피 카테고리",
      count: recipeCategories.length,
      accent: "brand",
    },
    {
      href: "/settings/categories/ingredient",
      title: "재료 카테고리",
      count: ingredientCategories.length,
      accent: "ingredient",
    },
    {
      href: "/settings/categories/package-unit",
      title: "포장 단위",
      count: packageUnits.length,
      accent: "data",
    },
  ];

  return (
    <main>
      <PageHeader title="카테고리 관리" />

      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.href}>
            <Link href={entry.href}>
              <Card accent={entry.accent} className="space-y-1">
                <p className="font-bold">{entry.title}</p>
                <p className="text-sm text-gray-500">{entry.count}개</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
