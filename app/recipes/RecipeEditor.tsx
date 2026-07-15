"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRecipeStore } from "@/store/recipeStore";
import { useIngredientStore } from "@/store/ingredientStore";
import { useRecipeCategoryStore } from "@/store/labelStores";
import { calculateRecipeCost, type CostLineItem } from "@/lib/domain/cost";
import { totalBatchGram } from "@/lib/domain/batch";
import { parseRecipeSnapshot, type RecipeSnapshotLine } from "@/lib/domain/recipeSnapshot";
import { CATEGORY_COLOR_PRESETS } from "@/lib/domain/labelColor";
import { parseNonNegativeNumber, type NonNegativeNumber } from "@/lib/domain/numbers";
import type { Ingredient, RecipeVersion } from "@/lib/domain/entities";
import type { IngredientId, RecipeCategoryId, RecipeId } from "@/lib/domain/ids";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FilterChip } from "@/components/ui/FilterChip";
import { SectionTitle } from "@/components/ui/SectionTitle";
import VersionList from "./VersionList";
import IngredientPickerModal from "./IngredientPickerModal";

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
      <RecipeEditorForm recipeId={null} initialCategoryIds={[]} initialLines={[]} versions={[]} />
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
      initialCategoryIds={recipe.categoryIds}
      initialMemo={recipe.memo}
      initialLines={snapshotResult.value.lines.map(toLineForm)}
      versions={versions}
    />
  );
}

interface RecipeEditorFormProps {
  recipeId: RecipeId | null;
  initialName?: string;
  initialCategoryIds: RecipeCategoryId[];
  initialMemo?: string;
  initialLines: RecipeLineForm[];
  versions: RecipeVersion[];
}

function RecipeEditorForm({
  recipeId,
  initialName = "",
  initialCategoryIds,
  initialMemo = "",
  initialLines,
  versions,
}: RecipeEditorFormProps) {
  const router = useRouter();
  const saveRecipe = useRecipeStore((s) => s.saveRecipe);
  const ingredients = useIngredientStore((s) => s.ingredients);
  const recipeCategories = useRecipeCategoryStore((s) => s.items);
  const saveRecipeCategory = useRecipeCategoryStore((s) => s.saveLabel);

  const [name, setName] = useState(initialName);
  const [categoryIds, setCategoryIds] = useState<RecipeCategoryId[]>(initialCategoryIds);

  function toggleCategory(id: RecipeCategoryId) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }
  const [memo, setMemo] = useState(initialMemo);
  const [lines, setLines] = useState<RecipeLineForm[]>(initialLines);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

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

  // 기본 배치량 = 재료 사용량 합(자동). 편집기에서는 재료량을 직접 편집한다.
  const totalGram = totalBatchGram(lines.map((l) => ({ quantityGram: l.quantityGram })));

  function handleSelectIngredient(ingredientId: IngredientId) {
    setLines((prev) =>
      prev.some((l) => l.ingredientId === ingredientId)
        ? prev
        : [...prev, { ingredientId, quantityGram: 0 }],
    );
    setPickerOpen(false);
  }

  async function handleAddCategory() {
    const trimmed = newCategoryName.trim();
    if (trimmed === "") {
      setCategoryError("이름을 입력해 주세요.");
      return;
    }
    setCategoryError(null);
    const colorHex =
      CATEGORY_COLOR_PRESETS[recipeCategories.length % CATEGORY_COLOR_PRESETS.length];
    const result = await saveRecipeCategory({ id: null, form: { name: trimmed, colorHex } });
    if (!result.ok) {
      setCategoryError("추가에 실패했습니다 (이름 필수).");
      return;
    }
    setCategoryIds((prev) => [...prev, result.value.id]);
    setNewCategoryName("");
    setAddingCategory(false);
  }

  function handleCancelAddCategory() {
    setAddingCategory(false);
    setNewCategoryName("");
    setCategoryError(null);
  }

  function handleRemoveLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function handleLineQuantityChange(index: number, quantityGram: number) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, quantityGram } : l)));
  }

  function handleRestore(version: RecipeVersion) {
    const snapshotResult = parseRecipeSnapshot(version.snapshotJson);
    if (!snapshotResult.ok) return;

    setLines(snapshotResult.value.lines.map(toLineForm));
  }

  async function handleSave() {
    setErrorMessage(null);
    setIsSaving(true);

    const form = {
      name,
      categoryIds,
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
          ? "입력값을 확인해 주세요 (이름 필수, 재료 1개 이상, 재료 중복 불가)."
          : result.error.type === "NotFound"
            ? "레시피를 찾을 수 없습니다."
            : "저장된 레시피 데이터가 손상되어 있습니다.",
      );
      return;
    }

    router.push("/recipes");
  }

  const fieldClass = "w-full border-pink-200 focus-visible:border-brand";
  const labelClass = "text-brand";

  return (
    <main>
      <PageHeader title={recipeId ? "레시피 수정" : "레시피 등록"} tone="brand" back />

      <div className="space-y-1.5">
        <label htmlFor="recipe-name" className={labelClass}>
          레시피명
        </label>
        <input
          id="recipe-name"
          className={fieldClass}
          placeholder="예: 피스타치오 젤라또"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <span className={`block text-sm font-medium ${labelClass}`}>카테고리</span>
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {recipeCategories.map((category) => (
            <FilterChip
              key={category.id}
              label={category.name}
              tone="brand"
              active={categoryIds.includes(category.id)}
              onClick={() => toggleCategory(category.id)}
            />
          ))}
          {!addingCategory && (
            <button
              type="button"
              onClick={() => setAddingCategory(true)}
              className="shrink-0 rounded-full border border-dashed border-pink-300 px-4 py-1.5 text-sm font-medium text-brand hover:bg-brand-soft"
            >
              + 추가
            </button>
          )}
        </div>
        {addingCategory && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                autoFocus
                className="flex-1 border-pink-200 focus-visible:border-brand"
                placeholder="새 카테고리명"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <Button type="button" tone="brand" variant="solid" onClick={handleAddCategory}>
                확인
              </Button>
              <Button
                type="button"
                tone="neutral"
                variant="outline"
                onClick={handleCancelAddCategory}
              >
                취소
              </Button>
            </div>
            {categoryError && <p className="text-sm text-danger">{categoryError}</p>}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="recipe-memo" className={labelClass}>
          메모 (선택)
        </label>
        <textarea
          id="recipe-memo"
          className={`${fieldClass} min-h-24`}
          placeholder="메모를 입력하세요"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <SectionTitle
          tone="brand"
          action={
            <Button type="button" tone="brand" variant="soft" onClick={() => setPickerOpen(true)}>
              + 재료 추가
            </Button>
          }
        >
          재료
        </SectionTitle>
        <p className="text-sm text-gray-500">
          총량(기본 배치량){" "}
          <span className="font-semibold text-gray-800">{totalGram.toLocaleString()}g</span> · 재료
          합으로 자동 계산돼요
        </p>
        {lines.length === 0 ? (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full rounded-2xl border-2 border-dashed border-pink-200 py-8 text-center text-sm text-gray-400 hover:bg-brand-soft"
          >
            재료를 추가해주세요
          </button>
        ) : (
          <ul className="space-y-3">
            {lines.map((line, index) => (
              <li key={index}>
                <Card accent="brand" className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-medium text-gray-800">
                    {ingredientMap.get(line.ingredientId as IngredientId)?.name ??
                      "알 수 없는 재료"}
                  </span>
                  <input
                    type="number"
                    aria-label="사용량(g)"
                    className="w-20"
                    value={line.quantityGram}
                    onChange={(e) => handleLineQuantityChange(index, Number(e.target.value))}
                  />
                  <span className="shrink-0 text-sm text-gray-500">g</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(index)}
                    className="shrink-0 border-none px-1 text-sm text-gray-400 hover:bg-transparent hover:text-danger"
                  >
                    삭제
                  </button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger"
        >
          {errorMessage}
        </p>
      )}

      {recipeId && (
        <div className="space-y-3">
          <SectionTitle tone="brand">수정 이력</SectionTitle>
          <VersionList
            versions={versions}
            ingredients={ingredients}
            limit={3}
            onRestore={handleRestore}
            restoreLabel="이 버전으로 복원"
          />
        </div>
      )}

      <div aria-hidden="true" className="h-28" />
      <div
        className="fixed inset-x-0 z-30 border-t border-gray-100 bg-white"
        style={{ bottom: "calc(var(--tab-bar-height) + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto max-w-2xl space-y-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-800">총 원가</span>
            <span className="text-lg font-bold text-danger">
              {costResult.totalCostKrw.toLocaleString()}원
            </span>
          </div>
          <Button
            type="button"
            tone="brand"
            variant="solid"
            fullWidth
            onClick={handleSave}
            disabled={isSaving}
          >
            {recipeId ? "수정" : "등록"}
          </Button>
        </div>
      </div>

      {pickerOpen && (
        <IngredientPickerModal
          ingredients={ingredients}
          onSelect={handleSelectIngredient}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </main>
  );
}
