"use client";

import { use } from "react";
import IngredientEditor from "../IngredientEditor";
import type { IngredientId } from "@/lib/domain/ids";

interface EditIngredientPageProps {
  params: Promise<{ id: string }>;
}

export default function EditIngredientPage({ params }: EditIngredientPageProps) {
  const { id } = use(params);
  return <IngredientEditor key={id} ingredientId={id as IngredientId} />;
}
