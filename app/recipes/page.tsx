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
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterChip } from "@/components/ui/FilterChip";
import { filterRecipes } from "@/lib/domain/recipeFilter";
import { latestVersionByRecipeId } from "@/lib/domain/recipeVersion";
import { parseRecipeSnapshot } from "@/lib/domain/recipeSnapshot";
import type { Recipe } from "@/lib/domain/entities";
import type { RecipeCategoryId } from "@/lib/domain/ids";

function ingredientCountOf(
  recipe: Recipe,
  latestVersionMap: ReadonlyMap<Recipe["id"], { snapshotJson: string }>,
): number {
  const version = latestVersionMap.get(recipe.id);
  if (!version) return 0;
  const snapshotResult = parseRecipeSnapshot(version.snapshotJson);
  return snapshotResult.ok ? snapshotResult.value.lines.length : 0;
}

export default function RecipesPage() {
  const recipes = useRecipeStore((s) => s.recipes);
  const loadRecipes = useRecipeStore((s) => s.loadRecipes);
  const removeRecipe = useRecipeStore((s) => s.removeRecipe);
  const allVersions = useRecipeStore((s) => s.allVersions);
  const loadAllVersions = useRecipeStore((s) => s.loadAllVersions);
  const recipeCategories = useRecipeCategoryStore((s) => s.items);
  const loadRecipeCategories = useRecipeCategoryStore((s) => s.loadItems);

  const [pendingDelete, setPendingDelete] = useState<Recipe | null>(null);
  const [searchText, setSearchText] = useState("");
  const [categoryId, setCategoryId] = useState<RecipeCategoryId | null>(null);

  useEffect(() => {
    loadRecipes();
    loadRecipeCategories();
    loadAllVersions();
  }, [loadRecipes, loadRecipeCategories, loadAllVersions]);

  const categoryMap = useMemo(
    () => new Map(recipeCategories.map((c) => [c.id, c])),
    [recipeCategories],
  );
  const latestVersionMap = useMemo(() => latestVersionByRecipeId(allVersions), [allVersions]);
  const filteredRecipes = useMemo(
    () => filterRecipes(recipes, { searchText, categoryId }),
    [recipes, searchText, categoryId],
  );

  return (
    <main>
      <PageHeader
        title="레시피"
        subtitle={`총 ${recipes.length}개`}
        actions={
          <Link
            href="/recipes/new"
            aria-label="새 레시피"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-brand text-lg leading-none text-brand hover:bg-brand-soft"
          >
            +
          </Link>
        }
      />

      <SearchBar value={searchText} onChange={setSearchText} placeholder="레시피 이름 검색" />

      <div className="flex gap-2 overflow-x-auto">
        <FilterChip label="전체" active={categoryId === null} onClick={() => setCategoryId(null)} />
        {recipeCategories.map((category) => (
          <FilterChip
            key={category.id}
            label={category.name}
            active={categoryId === category.id}
            onClick={() => setCategoryId(category.id)}
          />
        ))}
      </div>

      {filteredRecipes.length === 0 ? (
        recipes.length === 0 ? (
          <EmptyState title="아직 등록된 레시피가 없습니다" subtitle="새 레시피를 추가해 보세요" />
        ) : (
          <EmptyState
            title="조건에 맞는 레시피가 없습니다"
            subtitle="검색어나 카테고리를 확인해 보세요"
          />
        )
      ) : (
        <ul className="space-y-3">
          {filteredRecipes.map((recipe) => {
            const category = recipe.categoryId ? categoryMap.get(recipe.categoryId) : undefined;
            const ingredientCount = ingredientCountOf(recipe, latestVersionMap);
            return (
              <li key={recipe.id}>
                <Card accent="brand" className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/recipes/${recipe.id}`} className="font-bold underline">
                      {recipe.name}
                    </Link>
                    {category && <Badge label={category.name} colorHex={category.colorHex} />}
                  </div>
                  <p className="text-sm text-gray-500">재료 {ingredientCount}개</p>
                  <div className="flex items-center justify-between gap-2 text-sm text-gray-500">
                    <span>{recipe.batchSize.toLocaleString()}g</span>
                    <button type="button" onClick={() => setPendingDelete(recipe)}>
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
