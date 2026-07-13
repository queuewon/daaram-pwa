"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRecipeStore } from "@/store/recipeStore";
import { useRecipeCategoryStore } from "@/store/labelStores";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
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
  const allVersions = useRecipeStore((s) => s.allVersions);
  const loadAllVersions = useRecipeStore((s) => s.loadAllVersions);
  const recipeCategories = useRecipeCategoryStore((s) => s.items);
  const loadRecipeCategories = useRecipeCategoryStore((s) => s.loadItems);

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
        subtitle="등록된 젤라또를 한눈에"
        tone="brand"
        actions={
          <Link
            href="/recipes/new"
            aria-label="새 레시피"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-2xl leading-none text-white shadow-sm hover:opacity-90"
          >
            +
          </Link>
        }
      />

      <SearchBar value={searchText} onChange={setSearchText} placeholder="레시피 검색" />

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <FilterChip
          label="전체"
          tone="brand"
          active={categoryId === null}
          onClick={() => setCategoryId(null)}
        />
        {recipeCategories.map((category) => (
          <FilterChip
            key={category.id}
            label={category.name}
            tone="brand"
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
                <Link href={`/recipes/${recipe.id}`} className="block">
                  <Card accent="brand" className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-gray-900">{recipe.name}</p>
                      <p className="mt-1 text-sm text-gray-500">재료 {ingredientCount}개</p>
                    </div>
                    {category && <Badge label={category.name} colorHex={category.colorHex} />}
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
