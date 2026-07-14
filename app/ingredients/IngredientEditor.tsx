"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIngredientStore } from "@/store/ingredientStore";
import { useSupplierStore } from "@/store/supplierStore";
import { useIngredientCategoryStore, usePackageUnitStore } from "@/store/labelStores";
import { CATEGORY_COLOR_PRESETS } from "@/lib/domain/labelColor";
import type { IngredientPriceHistory } from "@/lib/domain/entities";
import type { IngredientCategoryId, IngredientId, SupplierId } from "@/lib/domain/ids";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FilterChip } from "@/components/ui/FilterChip";
import PriceHistory from "./PriceHistory";
import SupplierAddModal from "./SupplierAddModal";

interface IngredientEditorProps {
  ingredientId: IngredientId | null;
}

export default function IngredientEditor({ ingredientId }: IngredientEditorProps) {
  const ingredients = useIngredientStore((s) => s.ingredients);
  const priceHistory = useIngredientStore((s) => s.priceHistory);
  const loadIngredients = useIngredientStore((s) => s.loadIngredients);
  const loadPriceHistory = useIngredientStore((s) => s.loadPriceHistory);
  const loadSuppliers = useSupplierStore((s) => s.loadSuppliers);
  const loadIngredientCategories = useIngredientCategoryStore((s) => s.loadItems);
  const loadPackageUnits = usePackageUnitStore((s) => s.loadItems);

  useEffect(() => {
    loadIngredients();
    loadSuppliers();
    loadIngredientCategories();
    loadPackageUnits();
    if (ingredientId) loadPriceHistory(ingredientId);
  }, [
    ingredientId,
    loadIngredients,
    loadSuppliers,
    loadIngredientCategories,
    loadPackageUnits,
    loadPriceHistory,
  ]);

  if (ingredientId === null) {
    return (
      <IngredientEditorForm
        ingredientId={null}
        initialCategoryIds={[]}
        initialSupplierId={null}
        initialPackagePrice={0}
        initialPackageAmount={1}
        initialStockCount={0}
        initialStockUnit="g"
        initialUnitWeightGram={1}
        priceHistory={[]}
      />
    );
  }

  const ingredient = ingredients.find((i) => i.id === ingredientId);
  if (!ingredient) {
    return (
      <main>
        <p>불러오는 중...</p>
      </main>
    );
  }

  return (
    <IngredientEditorForm
      ingredientId={ingredientId}
      initialName={ingredient.name}
      initialCategoryIds={ingredient.categoryIds}
      initialSupplierId={ingredient.supplierId}
      initialPackagePrice={ingredient.packagePrice}
      initialPackageAmount={ingredient.packageAmount}
      initialStockCount={ingredient.stockCount}
      initialStockUnit={ingredient.stockUnit}
      initialUnitWeightGram={ingredient.unitWeightGram}
      priceHistory={priceHistory}
    />
  );
}

interface IngredientEditorFormProps {
  ingredientId: IngredientId | null;
  initialName?: string;
  initialCategoryIds: IngredientCategoryId[];
  initialSupplierId: SupplierId | null;
  initialPackagePrice: number;
  initialPackageAmount: number;
  initialStockCount: number;
  initialStockUnit: string;
  initialUnitWeightGram: number;
  priceHistory: IngredientPriceHistory[];
}

function IngredientEditorForm({
  ingredientId,
  initialName = "",
  initialCategoryIds,
  initialSupplierId,
  initialPackagePrice,
  initialPackageAmount,
  initialStockCount,
  initialStockUnit,
  initialUnitWeightGram,
  priceHistory,
}: IngredientEditorFormProps) {
  const router = useRouter();
  const saveIngredient = useIngredientStore((s) => s.saveIngredient);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const saveSupplier = useSupplierStore((s) => s.saveSupplier);
  const ingredientCategories = useIngredientCategoryStore((s) => s.items);
  const saveIngredientCategory = useIngredientCategoryStore((s) => s.saveLabel);
  const packageUnits = usePackageUnitStore((s) => s.items);
  const savePackageUnit = usePackageUnitStore((s) => s.saveLabel);

  const [name, setName] = useState(initialName);
  const [categoryIds, setCategoryIds] = useState<IngredientCategoryId[]>(initialCategoryIds);
  const [supplierId, setSupplierId] = useState<SupplierId | "">(initialSupplierId ?? "");

  function toggleCategory(id: IngredientCategoryId) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }
  const [purchasePrice, setPurchasePrice] = useState(initialPackagePrice);
  const [totalWeight, setTotalWeight] = useState(initialPackageAmount);
  const [unitWeightGram, setUnitWeightGram] = useState(initialUnitWeightGram);
  const [stockCount, setStockCount] = useState(initialStockCount);
  const [stockUnit, setStockUnit] = useState(initialStockUnit);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingUnit, setAddingUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // 원가는 그램 기준: 원/g = 구매가격 ÷ 총중량(g).
  const packageAmount = totalWeight;
  const pricePerGram = packageAmount > 0 ? purchasePrice / packageAmount : 0;
  // 재고 가치(원) = 재고 × 1단위당 중량 × 원/g (도메인 규칙의 UI 미리보기).
  const stockValue = Math.round(stockCount * unitWeightGram * pricePerGram);

  // 세는 단위를 "g"으로 두면 다리(1단위당 중량)는 항상 1.
  function handleStockUnitChange(unit: string) {
    setStockUnit(unit);
    if (unit === "g") setUnitWeightGram(1);
  }

  async function handleSave() {
    setErrorMessage(null);
    setIsSaving(true);

    const form = {
      name,
      categoryIds,
      supplierId: supplierId === "" ? null : supplierId,
      packagePrice: purchasePrice,
      packageAmount,
      stockCount,
      stockUnit,
      unitWeightGram,
    };

    const result = await saveIngredient({ ingredientId, form });
    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage(
        result.error.type === "InvalidForm"
          ? "입력값을 확인해 주세요 (이름 필수, 구매가격/재고 0 이상, 총 중량·단위 중량 0 초과)."
          : result.error.type === "NotFound"
            ? "재료를 찾을 수 없습니다."
            : "저장된 재료 데이터가 손상되어 있습니다.",
      );
      return;
    }

    router.push("/ingredients");
  }

  async function handleAddCategory() {
    const trimmed = newCategoryName.trim();
    if (trimmed === "") {
      setInlineError("이름을 입력해 주세요.");
      return;
    }
    setInlineError(null);
    const colorHex =
      CATEGORY_COLOR_PRESETS[ingredientCategories.length % CATEGORY_COLOR_PRESETS.length];
    const result = await saveIngredientCategory({ id: null, form: { name: trimmed, colorHex } });
    if (!result.ok) {
      setInlineError("추가에 실패했습니다.");
      return;
    }
    setCategoryIds((prev) => [...prev, result.value.id]);
    setNewCategoryName("");
    setAddingCategory(false);
  }

  async function handleAddUnit() {
    const trimmed = newUnitName.trim();
    if (trimmed === "") {
      setInlineError("단위 이름을 입력해 주세요.");
      return;
    }
    setInlineError(null);
    const colorHex = CATEGORY_COLOR_PRESETS[packageUnits.length % CATEGORY_COLOR_PRESETS.length];
    const result = await savePackageUnit({ id: null, form: { name: trimmed, colorHex } });
    if (!result.ok) {
      setInlineError("추가에 실패했습니다.");
      return;
    }
    setStockUnit(result.value.name);
    setNewUnitName("");
    setAddingUnit(false);
  }

  async function handleAddSupplier(form: {
    name: string;
    contact: string;
    memo: string;
  }): Promise<boolean> {
    const result = await saveSupplier({ supplierId: null, form });
    if (!result.ok) return false;
    setSupplierId(result.value.id);
    setSupplierModalOpen(false);
    return true;
  }

  const fieldClass = "w-full border-amber-200 focus-visible:border-ingredient";
  const labelClass = "text-ingredient";
  const numClass =
    "w-24 border-transparent bg-transparent p-0 text-right text-base font-semibold text-gray-900 shadow-none outline-none focus-visible:border-transparent";
  const addChipClass =
    "shrink-0 rounded-full border border-dashed border-amber-300 px-4 py-1.5 text-sm font-medium text-ingredient hover:bg-ingredient-soft";

  return (
    <main>
      <PageHeader title={ingredientId ? "재료 수정" : "재료 등록"} tone="ingredient" back />

      <div className="space-y-1.5">
        <label htmlFor="ingredient-name" className={labelClass}>
          재료명
        </label>
        <input
          id="ingredient-name"
          className={fieldClass}
          placeholder="예: 우유"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <span className={`block text-sm font-medium ${labelClass}`}>카테고리</span>
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {ingredientCategories.map((category) => (
            <FilterChip
              key={category.id}
              label={category.name}
              tone="ingredient"
              active={categoryIds.includes(category.id)}
              onClick={() => toggleCategory(category.id)}
            />
          ))}
          {!addingCategory && (
            <button
              type="button"
              onClick={() => {
                setAddingCategory(true);
                setInlineError(null);
              }}
              className={addChipClass}
            >
              + 추가
            </button>
          )}
        </div>
        {addingCategory && (
          <InlineAddRow
            placeholder="새 카테고리명"
            value={newCategoryName}
            error={inlineError}
            onChange={setNewCategoryName}
            onConfirm={handleAddCategory}
            onCancel={() => {
              setAddingCategory(false);
              setNewCategoryName("");
              setInlineError(null);
            }}
          />
        )}
      </div>

      <div className="space-y-2">
        <span className={`block text-sm font-medium ${labelClass}`}>구매 정보</span>
        <Card accent="ingredient" className="divide-y divide-amber-100 p-0">
          <PurchaseRow
            label="구매가격"
            unit="원"
            value={purchasePrice}
            onChange={setPurchasePrice}
            className={numClass}
          />
          <PurchaseRow
            label="총 중량"
            unit="g"
            value={totalWeight}
            onChange={setTotalWeight}
            className={numClass}
          />
        </Card>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${labelClass}`}>세는 단위</span>
          <Link
            href="/settings/categories/package-unit"
            className="text-sm font-semibold text-ingredient"
          >
            편집
          </Link>
        </div>
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {packageUnits.map((unit) => (
            <FilterChip
              key={unit.id}
              label={unit.name}
              tone="ingredient"
              active={stockUnit === unit.name}
              onClick={() => handleStockUnitChange(unit.name)}
            />
          ))}
          {!addingUnit && (
            <button
              type="button"
              onClick={() => {
                setAddingUnit(true);
                setInlineError(null);
              }}
              className={addChipClass}
            >
              + 추가
            </button>
          )}
        </div>
        {addingUnit && (
          <InlineAddRow
            placeholder="새 단위 (예: 박스)"
            value={newUnitName}
            error={inlineError}
            onChange={setNewUnitName}
            onConfirm={handleAddUnit}
            onCancel={() => {
              setAddingUnit(false);
              setNewUnitName("");
              setInlineError(null);
            }}
          />
        )}
      </div>

      {stockUnit !== "g" && (
        <div className="space-y-1.5">
          <label htmlFor="ingredient-unit-weight" className={labelClass}>
            1{stockUnit || "단위"}당 중량 (g)
          </label>
          <input
            id="ingredient-unit-weight"
            type="number"
            className={fieldClass}
            placeholder="예: 1000"
            value={unitWeightGram}
            onChange={(e) => setUnitWeightGram(Number(e.target.value))}
          />
          <p className="text-xs text-gray-400">재고를 그램·금액으로 환산하는 기준이에요.</p>
        </div>
      )}

      <div className="space-y-1 rounded-2xl border border-amber-200 bg-ingredient-soft px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">1g당 가격</span>
          <span className="font-bold text-ingredient">
            {pricePerGram > 0 ? `${pricePerGram.toLocaleString()}원` : "-"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">재고 가치</span>
          <span className="font-bold text-ingredient">
            {stockValue > 0 ? `${stockValue.toLocaleString()}원` : "-"}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="ingredient-stock-count" className={labelClass}>
          재고
        </label>
        <div className="relative">
          <input
            id="ingredient-stock-count"
            type="number"
            className={`${fieldClass} pr-12`}
            value={stockCount}
            onChange={(e) => setStockCount(Number(e.target.value))}
          />
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-gray-500">
            {stockUnit || "개"}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${labelClass}`}>공급업체</span>
            <Link href="/suppliers" className="text-sm font-semibold text-ingredient">
              관리
            </Link>
          </div>
          <Button
            type="button"
            tone="ingredient"
            variant="soft"
            onClick={() => setSupplierModalOpen(true)}
          >
            + 새 공급업체
          </Button>
        </div>
        {suppliers.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-amber-200 py-6 text-center text-sm text-gray-400">
            등록된 공급업체가 없어요
          </div>
        ) : (
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
            {suppliers.map((supplier) => (
              <FilterChip
                key={supplier.id}
                label={supplier.name}
                tone="ingredient"
                active={supplierId === supplier.id}
                onClick={() => setSupplierId(supplierId === supplier.id ? "" : supplier.id)}
              />
            ))}
          </div>
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

      <Button
        type="button"
        tone="ingredient"
        variant="solid"
        fullWidth
        onClick={handleSave}
        disabled={isSaving}
      >
        저장
      </Button>

      {ingredientId && (
        <div className="space-y-3">
          <h2>수정 이력</h2>
          <PriceHistory history={priceHistory} bare limit={3} />
        </div>
      )}

      {supplierModalOpen && (
        <SupplierAddModal onSave={handleAddSupplier} onClose={() => setSupplierModalOpen(false)} />
      )}
    </main>
  );
}

function PurchaseRow({
  label,
  unit,
  value,
  onChange,
  className,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (value: number) => void;
  className: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          aria-label={label}
          className={className}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
    </div>
  );
}

function InlineAddRow({
  placeholder,
  value,
  error,
  onChange,
  onConfirm,
  onCancel,
}: {
  placeholder: string;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          className="flex-1 border-amber-200 focus-visible:border-ingredient"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onConfirm();
            }
          }}
        />
        <Button type="button" tone="ingredient" variant="solid" onClick={onConfirm}>
          확인
        </Button>
        <Button type="button" tone="neutral" variant="outline" onClick={onCancel}>
          취소
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
