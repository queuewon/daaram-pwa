"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRecipeStore } from "@/store/recipeStore";
import { useRecipeCategoryStore } from "@/store/labelStores";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Recipe } from "@/lib/domain/entities";

export default function RecipesPage() {
  const recipes = useRecipeStore((s) => s.recipes);
  const loadRecipes = useRecipeStore((s) => s.loadRecipes);
  const removeRecipe = useRecipeStore((s) => s.removeRecipe);
  const recipeCategories = useRecipeCategoryStore((s) => s.items);
  const loadRecipeCategories = useRecipeCategoryStore((s) => s.loadItems);

  const [pendingDelete, setPendingDelete] = useState<Recipe | null>(null);

  useEffect(() => {
    loadRecipes();
    loadRecipeCategories();
  }, [loadRecipes, loadRecipeCategories]);

  const categoryMap = useMemo(
    () => new Map(recipeCategories.map((c) => [c.id, c])),
    [recipeCategories],
  );

  return (
    <main>
      <PageHeader
        title="레시피"
        actions={
          <Link
            href="/recipes/new"
            className="inline-block rounded border border-gray-400 px-3 py-1 hover:bg-gray-100"
          >
            새 레시피
          </Link>
        }
      />

      {recipes.length === 0 ? (
        <EmptyState title="아직 등록된 레시피가 없습니다" subtitle="새 레시피를 추가해 보세요" />
      ) : (
        <ul className="space-y-3">
          {recipes.map((recipe) => {
            const category = recipe.categoryId ? categoryMap.get(recipe.categoryId) : undefined;
            return (
              <li key={recipe.id}>
                <Card accent="brand" className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link href={`/recipes/${recipe.id}`} className="underline">
                      {recipe.name}
                    </Link>
                    {category && <Badge label={category.name} colorHex={category.colorHex} />}
                  </div>
                  <span className="text-sm text-gray-500">{recipe.batchSize}g</span>
                  <button type="button" onClick={() => setPendingDelete(recipe)}>
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
        title="레시피 삭제"
        description={`"${pendingDelete?.name ?? ""}" 레시피를 삭제하시겠습니까? 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          if (pendingDelete) removeRecipe(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}
