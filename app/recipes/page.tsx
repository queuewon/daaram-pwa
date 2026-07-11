"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRecipeStore } from "@/store/recipeStore";

export default function RecipesPage() {
  const recipes = useRecipeStore((s) => s.recipes);
  const loadRecipes = useRecipeStore((s) => s.loadRecipes);
  const removeRecipe = useRecipeStore((s) => s.removeRecipe);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  return (
    <main>
      <h1>레시피</h1>
      <Link
        href="/recipes/new"
        className="inline-block rounded border border-gray-400 px-3 py-1 hover:bg-gray-100"
      >
        새 레시피
      </Link>
      <ul className="divide-y divide-gray-200 border border-gray-200 rounded">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="flex items-center justify-between gap-2 px-3 py-2">
            <Link href={`/recipes/${recipe.id}`} className="underline">
              {recipe.name}
            </Link>
            <span className="text-sm text-gray-500">{recipe.batchSize}g</span>
            <button type="button" onClick={() => removeRecipe(recipe.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
