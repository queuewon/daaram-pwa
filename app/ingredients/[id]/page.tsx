"use client";

import { use } from "react";
import IngredientDetail from "../IngredientDetail";
import type { IngredientId } from "@/lib/domain/ids";

interface IngredientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function IngredientDetailPage({ params }: IngredientDetailPageProps) {
  const { id } = use(params);
  return <IngredientDetail key={id} ingredientId={id as IngredientId} />;
}
