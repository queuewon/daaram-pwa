"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRecipeStore } from "@/store/recipeStore";
import { useIngredientStore } from "@/store/ingredientStore";
import { useRecipeCategoryStore } from "@/store/labelStores";
import { calculateRecipeCost, type CostLineItem } from "@/lib/domain/cost";
import { BATCH_STEP_GRAM, scaleBatch, stepBatchSize } from "@/lib/domain/batch";
import { parseRecipeSnapshot, type RecipeSnapshotLine } from "@/lib/domain/recipeSnapshot";
import {
  parseNonNegativeNumber,
  parsePositiveNumber,
  type NonNegativeNumber,
  type PositiveNumber,
} from "@/lib/domain/numbers";
import type { Ingredient, Recipe, RecipeVersion } from "@/lib/domain/entities";
import type { IngredientId, RecipeId } from "@/lib/domain/ids";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import VersionList from "./VersionList";

interface RecipeDetailProps {
  recipeId: RecipeId;
}

function toNonNegative(n: number): NonNegativeNumber {
  const clamped = Number.isFinite(n) ? Math.max(0, n) : 0;
  const result = parseNonNegativeNumber(clamped);
  return result.ok ? result.value : (0 as NonNegativeNumber);
}

export default function RecipeDetail({ recipeId }: RecipeDetailProps) {
  const recipes = useRecipeStore((s) => s.recipes);
  const versions = useRecipeStore((s) => s.versions);
  const loadRecipes = useRecipeStore((s) => s.loadRecipes);
  const loadVersions = useRecipeStore((s) => s.loadVersions);
  const ingredients = useIngredientStore((s) => s.ingredients);
  const loadIngredients = useIngredientStore((s) => s.loadIngredients);
  const recipeCategories = useRecipeCategoryStore((s) => s.items);
  const loadRecipeCategories = useRecipeCategoryStore((s) => s.loadItems);

  useEffect(() => {
    loadRecipes();
    loadVersions(recipeId);
    loadIngredients();
    loadRecipeCategories();
  }, [recipeId, loadRecipes, loadVersions, loadIngredients, loadRecipeCategories]);

  const recipe = recipes.find((r) => r.id === recipeId);
  const latestVersion = versions.find((v) => v.recipeId === recipeId);

  if (!recipe || !latestVersion) {
    return (
      <main>
        <p>불러오는 중...</p>
      </main>
    );
  }

  const snapshotResult = parseRecipeSnapshot(latestVersion.snapshotJson);
  if (!snapshotResult.ok) {
    return (
      <main>
        <p role="alert">저장된 레시피 데이터가 손상되어 있습니다.</p>
      </main>
    );
  }

  const categories = recipe.categoryIds
    .map((id) => recipeCategories.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  return (
    <RecipeDetailView
      recipe={recipe}
      categories={categories}
      lines={snapshotResult.value.lines}
      ingredients={ingredients}
      versions={versions}
    />
  );
}

interface RecipeDetailViewProps {
  recipe: Recipe;
  categories: { id: string; name: string; colorHex: string }[];
  lines: readonly RecipeSnapshotLine[];
  ingredients: Ingredient[];
  versions: RecipeVersion[];
}

function RecipeDetailView({
  recipe,
  categories,
  lines,
  ingredients,
  versions,
}: RecipeDetailViewProps) {
  const router = useRouter();
  const removeRecipe = useRecipeStore((s) => s.removeRecipe);
  const saveRecipe = useRecipeStore((s) => s.saveRecipe);
  const loadVersions = useRecipeStore((s) => s.loadVersions);

  const [batchSize, setBatchSize] = useState<PositiveNumber>(recipe.batchSize);
  const [batchInput, setBatchInput] = useState(recipe.batchSize.toLocaleString());
  const [pendingDelete, setPendingDelete] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<RecipeVersion | null>(null);

  async function handleRestore(version: RecipeVersion) {
    const parsed = parseRecipeSnapshot(version.snapshotJson);
    if (!parsed.ok) return;
    await saveRecipe({
      recipeId: recipe.id,
      form: {
        name: recipe.name,
        categoryIds: recipe.categoryIds,
        batchSize: parsed.value.batchSize,
        memo: recipe.memo,
        lines: parsed.value.lines.map((l) => ({
          ingredientId: l.ingredientId,
          quantityGram: l.quantityGram,
        })),
      },
    });
    setPendingRestore(null);
    loadVersions(recipe.id);
  }

  const ingredientMap = useMemo(
    () => new Map<IngredientId, Ingredient>(ingredients.map((i) => [i.id, i])),
    [ingredients],
  );

  const scaledLines = useMemo(
    () =>
      scaleBatch({
        baseYieldGram: recipe.batchSize,
        targetYieldGram: batchSize,
        lines,
      }),
    [recipe.batchSize, batchSize, lines],
  );

  const costResult = useMemo(() => {
    const costLines: CostLineItem[] = scaledLines.map((line) => ({
      ingredientId: line.ingredientId,
      quantityGram: toNonNegative(line.scaledQuantityGram),
      unitPriceKrwPerGram: ingredientMap.get(line.ingredientId)?.pricePerGram ?? 0,
    }));
    return calculateRecipeCost(costLines);
  }, [scaledLines, ingredientMap]);

  function commitBatch(next: PositiveNumber) {
    setBatchSize(next);
    setBatchInput(next.toLocaleString());
  }

  function handleStep(delta: number) {
    commitBatch(stepBatchSize(batchSize, delta));
  }

  function handleBatchInputChange(raw: string) {
    setBatchInput(raw);
    const result = parsePositiveNumber(Number(raw.replaceAll(",", "")));
    if (result.ok) setBatchSize(result.value);
  }

  function handleBatchInputBlur() {
    const result = parsePositiveNumber(Number(batchInput.replaceAll(",", "")));
    setBatchInput(result.ok ? result.value.toLocaleString() : batchSize.toLocaleString());
  }

  async function handleDelete() {
    await removeRecipe(recipe.id);
    setPendingDelete(false);
    router.push("/recipes");
  }

  return (
    <main>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="뒤로가기"
          onClick={() => router.back()}
          className="shrink-0 border-none px-1 py-1 text-sm text-gray-600 hover:bg-transparent hover:text-gray-900"
        >
          ← 뒤로가기
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" tone="brand" variant="soft" onClick={() => setPendingDelete(true)}>
            삭제
          </Button>
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="inline-flex items-center rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-brand hover:brightness-95"
          >
            수정
          </Link>
        </div>
      </div>

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{recipe.name}</h1>
          <p className="mt-1 text-sm text-gray-500">재료 {lines.length}개</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {categories.map((c) => (
            <Badge key={c.id} label={c.name} colorHex={c.colorHex} />
          ))}
        </div>
      </header>

      {recipe.memo.trim() !== "" && (
        <Card accent="brand" className="space-y-1">
          <p className="font-bold text-brand">메모</p>
          <p className="whitespace-pre-wrap text-sm text-gray-700">{recipe.memo}</p>
        </Card>
      )}

      <Card accent="brand" className="space-y-3">
        <p className="text-sm font-medium text-gray-500">배치량 조절 (G)</p>
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            aria-label="배치량 감소"
            onClick={() => handleStep(-BATCH_STEP_GRAM)}
            className="flex h-14 w-14 items-center justify-center rounded-full border-transparent bg-brand-soft text-2xl leading-none text-brand hover:brightness-95"
          >
            −
          </button>
          <input
            type="text"
            inputMode="numeric"
            aria-label="배치량"
            value={batchInput}
            onChange={(e) => handleBatchInputChange(e.target.value)}
            onBlur={handleBatchInputBlur}
            className="w-32 border-transparent bg-transparent p-0 text-center text-3xl font-bold text-brand shadow-none outline-none focus-visible:border-transparent"
          />
          <button
            type="button"
            aria-label="배치량 증가"
            onClick={() => handleStep(BATCH_STEP_GRAM)}
            className="flex h-14 w-14 items-center justify-center rounded-full border-transparent bg-brand-soft text-2xl leading-none text-brand hover:brightness-95"
          >
            +
          </button>
        </div>
      </Card>

      <Card accent="brand" className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pink-100 text-left text-brand">
              <th className="px-4 py-3 font-semibold">재료명</th>
              <th className="px-4 py-3 text-right font-semibold">사용량(g)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-100">
            {scaledLines.map((line) => (
              <tr key={line.ingredientId}>
                <td className="px-4 py-3 text-gray-800">
                  {ingredientMap.get(line.ingredientId)?.name ?? line.ingredientId}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {Math.round(line.scaledQuantityGram).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-ingredient-soft p-4 shadow-sm">
        <p className="font-bold text-brand">총 원가</p>
        <p className="text-2xl font-bold text-danger">
          {costResult.totalCostKrw.toLocaleString()}원
        </p>
      </div>

      <div className="space-y-3">
        <SectionTitle tone="brand">수정이력</SectionTitle>
        <VersionList
          versions={versions}
          ingredients={ingredients}
          limit={3}
          onRestore={setPendingRestore}
          restoreLabel="이 버전으로 복원"
        />
      </div>

      <ConfirmDialog
        open={pendingDelete}
        title="레시피 삭제"
        description={`"${recipe.name}" 레시피를 삭제하시겠습니까? 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(false)}
      />

      <ConfirmDialog
        open={pendingRestore !== null}
        title="버전 복원"
        description={`v${pendingRestore?.versionNo ?? ""} 내용으로 되돌립니다. 현재 내용은 새 버전으로 남아 있어요. 복원할까요?`}
        confirmLabel="복원"
        onConfirm={() => {
          if (pendingRestore) handleRestore(pendingRestore);
        }}
        onCancel={() => setPendingRestore(null)}
      />
    </main>
  );
}
