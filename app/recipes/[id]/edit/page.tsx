"use client";

import { use } from "react";
import RecipeEditor from "../../RecipeEditor";
import type { RecipeId } from "@/lib/domain/ids";

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export default function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = use(params);
  return <RecipeEditor key={id} recipeId={id as RecipeId} />;
}
