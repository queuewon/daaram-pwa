"use client";

import { use } from "react";
import RecipeDetail from "../RecipeDetail";
import type { RecipeId } from "@/lib/domain/ids";

interface RecipeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = use(params);
  return <RecipeDetail key={id} recipeId={id as RecipeId} />;
}
