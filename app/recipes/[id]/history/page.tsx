"use client";

import { use, useEffect } from "react";
import { useRecipeStore } from "@/store/recipeStore";
import { PageHeader } from "@/components/ui/PageHeader";
import type { RecipeId } from "@/lib/domain/ids";
import VersionHistory from "../../VersionHistory";

interface RecipeHistoryPageProps {
  params: Promise<{ id: string }>;
}

export default function RecipeHistoryPage({ params }: RecipeHistoryPageProps) {
  const { id } = use(params);
  const recipeId = id as RecipeId;

  const versions = useRecipeStore((s) => s.versions);
  const loadVersions = useRecipeStore((s) => s.loadVersions);

  useEffect(() => {
    loadVersions(recipeId);
  }, [recipeId, loadVersions]);

  return (
    <main>
      <PageHeader title="수정 이력" />
      <VersionHistory versions={versions} />
    </main>
  );
}
