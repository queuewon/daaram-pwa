"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRecipeStore } from "@/store/recipeStore";
import { useIngredientStore } from "@/store/ingredientStore";
import { useRecipeCategoryStore } from "@/store/labelStores";
import { calculateRecipeCost, type CostLineItem } from "@/lib/domain/cost";
import { scaleBatch } from "@/lib/domain/batch";
import { parseRecipeSnapshot, type RecipeSnapshotLine } from "@/lib/domain/recipeSnapshot";
import {
  parseNonNegativeNumber,
  parsePositiveNumber,
  type NonNegativeNumber,
} from "@/lib/domain/numbers";
import type { Ingredient, RecipeVersion } from "@/lib/domain/entities";
import type { IngredientId, RecipeCategoryId, RecipeId } from "@/lib/domain/ids";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import VersionHistory from "./VersionHistory";

interface RecipeLineForm {
  ingredientId: IngredientId | "";
  quantityGram: number;
}

interface RecipeEditorProps {
  recipeId: RecipeId | null;
}

function toNonNegative(n: number): NonNegativeNumber {
  const clamped = Number.isFinite(n) ? Math.max(0, n) : 0;
  const result = parseNonNegativeNumber(clamped);
  return result.ok ? result.value : (0 as NonNegativeNumber);
}

function toLineForm(line: RecipeSnapshotLine): RecipeLineForm {
  return { ingredientId: line.ingredientId, quantityGram: line.quantityGram };
}

export default function RecipeEditor({ recipeId }: RecipeEditorProps) {
  const recipes = useRecipeStore((s) => s.recipes);
  const versions = useRecipeStore((s) => s.versions);
  const loadRecipes = useRecipeStore((s) => s.loadRecipes);
  const loadVersions = useRecipeStore((s) => s.loadVersions);
  const loadIngredients = useIngredientStore((s) => s.loadIngredients);
  const loadRecipeCategories = useRecipeCategoryStore((s) => s.loadItems);

  useEffect(() => {
    loadIngredients();
    loadRecipes();
    loadRecipeCategories();
    if (recipeId) loadVersions(recipeId);
  }, [recipeId, loadIngredients, loadRecipes, loadVersions, loadRecipeCategories]);

  if (recipeId === null) {
    return (
      <RecipeEditorForm
        recipeId={null}
        initialCategoryId={null}
        initialBatchSize={1000}
        initialLines={[]}
        versions={[]}
      />
    );
  }

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

  return (
    <RecipeEditorForm
      recipeId={recipeId}
      initialName={recipe.name}
      initialCategoryId={recipe.categoryId}
      initialMemo={recipe.memo}
      initialBatchSize={snapshotResult.value.batchSize}
      initialLines={snapshotResult.value.lines.map(toLineForm)}
      versions={versions}
    />
  );
}

interface RecipeEditorFormProps {
  recipeId: RecipeId | null;
  initialName?: string;
  initialCategoryId: RecipeCategoryId | null;
  initialMemo?: string;
  initialBatchSize: number;
  initialLines: RecipeLineForm[];
  versions: RecipeVersion[];
}

function RecipeEditorForm({
  recipeId,
  initialName = "",
  initialCategoryId,
  initialMemo = "",
  initialBatchSize,
  initialLines,
  versions,
}: RecipeEditorFormProps) {
  const router = useRouter();
  const saveRecipe = useRecipeStore((s) => s.saveRecipe);
  const ingredients = useIngredientStore((s) => s.ingredients);
  const recipeCategories = useRecipeCategoryStore((s) => s.items);

  const [name, setName] = useState(initialName);
  const [categoryId, setCategoryId] = useState<RecipeCategoryId | "">(initialCategoryId ?? "");
  const [memo, setMemo] = useState(initialMemo);
  const [batchSize, setBatchSize] = useState(initialBatchSize);
  const [lines, setLines] = useState<RecipeLineForm[]>(initialLines);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const ingredientMap = useMemo(
    () => new Map<IngredientId, Ingredient>(ingredients.map((i) => [i.id, i])),
    [ingredients],
  );

  const costResult = useMemo(() => {
    const costLines: CostLineItem[] = [];
    for (const line of lines) {
      if (line.ingredientId === "") continue;
      costLines.push({
        ingredientId: line.ingredientId,
        quantityGram: toNonNegative(line.quantityGram),
        unitPriceKrwPerGram: ingredientMap.get(line.ingredientId)?.pricePerGram ?? 0,
      });
    }
    return calculateRecipeCost(costLines);
  }, [lines, ingredientMap]);

  function handleBatchSizeChange(nextValue: number) {
    const basePos = parsePositiveNumber(batchSize);
    const targetPos = parsePositiveNumber(nextValue);

    if (basePos.ok && targetPos.ok && lines.length > 0) {
      const scaled = scaleBatch({
        baseYieldGram: basePos.value,
        targetYieldGram: targetPos.value,
        lines: lines
          .filter(
            (l): l is RecipeLineForm & { ingredientId: IngredientId } => l.ingredientId !== "",
          )
          .map((l) => ({
            ingredientId: l.ingredientId,
            quantityGram: toNonNegative(l.quantityGram),
          })),
      });
      setLines((prev) =>
        prev.map((l) => {
          if (l.ingredientId === "") return l;
          const match = scaled.find((s) => s.ingredientId === l.ingredientId);
          return match ? { ...l, quantityGram: match.scaledQuantityGram } : l;
        }),
      );
    }

    setBatchSize(nextValue);
  }

  function handleAddLine() {
    setLines((prev) => [...prev, { ingredientId: "", quantityGram: 0 }]);
  }

  function handleRemoveLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function handleLineIngredientChange(index: number, ingredientId: IngredientId) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ingredientId } : l)));
  }

  function handleLineQuantityChange(index: number, quantityGram: number) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, quantityGram } : l)));
  }

  function handleRestore(version: RecipeVersion) {
    const snapshotResult = parseRecipeSnapshot(version.snapshotJson);
    if (!snapshotResult.ok) return;

    setBatchSize(snapshotResult.value.batchSize);
    setLines(snapshotResult.value.lines.map(toLineForm));
  }

  async function handleSave() {
    setErrorMessage(null);
    setIsSaving(true);

    const form = {
      name,
      categoryId: categoryId === "" ? null : categoryId,
      batchSize,
      memo,
      lines: lines
        .filter((l) => l.ingredientId !== "")
        .map((l) => ({ ingredientId: l.ingredientId, quantityGram: l.quantityGram })),
    };

    const result = await saveRecipe({ recipeId, form });
    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage(
        result.error.type === "InvalidForm"
          ? "입력값을 확인해 주세요 (이름 필수, 배치량 0 초과, 재료 중복 불가)."
          : result.error.type === "NotFound"
            ? "레시피를 찾을 수 없습니다."
            : "저장된 레시피 데이터가 손상되어 있습니다.",
      );
      return;
    }

    router.push(`/recipes/${result.value.id}`);
  }

  const selectedCategory =
    categoryId === "" ? undefined : recipeCategories.find((c) => c.id === categoryId);

  return (
    <main>
      <PageHeader title={recipeId ? "레시피 수정" : "새 레시피"} />

      <div>
        <label htmlFor="recipe-name">이름</label>
        <input
          id="recipe-name"
          className="w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="recipe-category">카테고리</label>
        <select
          id="recipe-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value as RecipeCategoryId | "")}
        >
          <option value="">카테고리 없음</option>
          {recipeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {selectedCategory && (
          <Badge label={selectedCategory.name} colorHex={selectedCategory.colorHex} />
        )}
      </div>

      <div>
        <label htmlFor="recipe-batch-size">배치량(g)</label>
        <input
          id="recipe-batch-size"
          type="number"
          value={batchSize}
          onChange={(e) => handleBatchSizeChange(Number(e.target.value))}
        />
      </div>

      <div>
        <label htmlFor="recipe-memo">메모</label>
        <textarea
          id="recipe-memo"
          className="w-full"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <section>
        <h2>재료</h2>
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded">
          {lines.map((line, index) => (
            <li key={index} className="flex items-center gap-2 px-3 py-2">
              <select
                value={line.ingredientId}
                onChange={(e) => handleLineIngredientChange(index, e.target.value as IngredientId)}
              >
                <option value="">재료 선택</option>
                {ingredients.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.id}>
                    {ingredient.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="w-24"
                value={line.quantityGram}
                onChange={(e) => handleLineQuantityChange(index, Number(e.target.value))}
              />
              <span>g</span>
              <button type="button" onClick={() => handleRemoveLine(index)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={handleAddLine}>
          재료 추가
        </button>
      </section>

      <section>
        <h2>원가</h2>
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded">
          {costResult.perLineCostKrw.map((line) => (
            <li key={line.ingredientId} className="flex items-center justify-between px-3 py-2">
              <span>{ingredientMap.get(line.ingredientId)?.name ?? line.ingredientId}</span>
              <span>{line.costKrw.toLocaleString()}원</span>
            </li>
          ))}
        </ul>
        <p className="font-semibold">합계: {costResult.totalCostKrw.toLocaleString()}원</p>
      </section>

      {errorMessage && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700">
          {errorMessage}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="border-gray-900 font-medium"
      >
        저장
      </button>

      {recipeId && <VersionHistory versions={versions} onRestore={handleRestore} />}
    </main>
  );
}
