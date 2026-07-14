import { z } from "zod";
import { ok, type Result } from "./result";
import { parseNonNegativeNumber, type NonNegativeNumber, type PositiveNumber } from "./numbers";
import type { OutOfRangeError } from "./numbers";
import type { Branded } from "./ids";
import type {
  IngredientCategoryId,
  IngredientId,
  IngredientPriceHistoryId,
  RecipeCategoryId,
  RecipeId,
  RecipeVersionId,
  SupplierId,
} from "./ids";
import type { Ingredient } from "./entities";

const nonNegativeNumberSchema = z
  .number()
  .min(0)
  .transform((n) => n as NonNegativeNumber);

const positiveNumberSchema = z
  .number()
  .gt(0)
  .transform((n) => n as PositiveNumber);

const colorHexSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

// pricePerGram 불변식 비교 시 부동소수점 오차 허용폭
const PRICE_PER_GRAM_EPSILON = 1e-6;

const recipeCategoryIdSchema = z
  .string()
  .min(1)
  .transform((v) => v as RecipeCategoryId);
const ingredientCategoryIdSchema = z
  .string()
  .min(1)
  .transform((v) => v as IngredientCategoryId);

/** 레거시 {categoryId} 레코드/백업을 {categoryIds} 배열로 정규화한다(비파괴 하위호환). */
function normalizeCategoryIds(raw: unknown): unknown {
  if (raw !== null && typeof raw === "object" && !("categoryIds" in raw) && "categoryId" in raw) {
    const { categoryId, ...rest } = raw as Record<string, unknown>;
    return { ...rest, categoryIds: categoryId == null ? [] : [categoryId] };
  }
  return raw;
}

// RecipeCategory / IngredientCategory / PackageUnit은 형태가 동일한 사용자 정의 라벨이라 팩토리로 중복 제거.
function labelSchema<B extends string>() {
  return z.object({
    id: z
      .string()
      .min(1)
      .transform((v) => v as Branded<string, B>),
    name: z.string().min(1),
    colorHex: colorHexSchema,
  });
}

export const recipeCategorySchema = labelSchema<"RecipeCategoryId">();
export const ingredientCategorySchema = labelSchema<"IngredientCategoryId">();
export const packageUnitSchema = labelSchema<"PackageUnitId">();

export const supplierSchema = z.object({
  id: z
    .string()
    .min(1)
    .transform((v) => v as SupplierId),
  name: z.string().min(1),
  contact: z.string(),
  memo: z.string(),
});

export const ingredientSchema = z.preprocess(
  normalizeCategoryIds,
  z
    .object({
      id: z
        .string()
        .min(1)
        .transform((v) => v as IngredientId),
      name: z.string().min(1),
      categoryIds: z.array(ingredientCategoryIdSchema),
      supplierId: z
        .string()
        .min(1)
        .transform((v) => v as SupplierId)
        .nullable(),
      packagePrice: nonNegativeNumberSchema,
      packageAmount: positiveNumberSchema,
      pricePerGram: nonNegativeNumberSchema,
      stockCount: nonNegativeNumberSchema,
      stockUnit: z.string().min(1),
      // 레거시 레코드/옛 백업(필드 없음)은 1로 파싱(비파괴). 값이 있으면 >0 검증.
      unitWeightGram: positiveNumberSchema.default(1 as PositiveNumber),
    })
    .refine(
      (v) => Math.abs(v.pricePerGram - v.packagePrice / v.packageAmount) < PRICE_PER_GRAM_EPSILON,
      {
        message: "pricePerGram은 packagePrice / packageAmount와 일치해야 합니다",
        path: ["pricePerGram"],
      },
    ),
);

export const ingredientPriceHistorySchema = z.object({
  id: z
    .string()
    .min(1)
    .transform((v) => v as IngredientPriceHistoryId),
  ingredientId: z
    .string()
    .min(1)
    .transform((v) => v as IngredientId),
  packagePrice: nonNegativeNumberSchema,
  packageAmount: positiveNumberSchema,
  recordedAt: z.string().min(1),
});

export const recipeSchema = z.preprocess(
  normalizeCategoryIds,
  z.object({
    id: z
      .string()
      .min(1)
      .transform((v) => v as RecipeId),
    name: z.string().min(1),
    categoryIds: z.array(recipeCategoryIdSchema),
    batchSize: positiveNumberSchema,
    memo: z.string(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  }),
);

export const recipeVersionSchema = z.object({
  id: z
    .string()
    .min(1)
    .transform((v) => v as RecipeVersionId),
  recipeId: z
    .string()
    .min(1)
    .transform((v) => v as RecipeId),
  versionNo: z.number().int().min(1),
  snapshotJson: z.string().min(1),
  createdAt: z.string().min(1),
});

export const dailyChecklistStatusSchema = z.enum(["pending", "in_progress", "done"]);

export const dailyChecklistSchema = z.object({
  id: z
    .string()
    .min(1)
    .transform((v) => v as Branded<string, "DailyChecklistId">),
  recipeId: z
    .string()
    .min(1)
    .transform((v) => v as RecipeId),
  date: z.string().min(1),
  batchSize: positiveNumberSchema,
  status: dailyChecklistStatusSchema,
});

// pricePerGram을 호출자가 직접 넣지 못하게 하고 항상 packagePrice/packageAmount에서 파생시킨다.
export interface CreateIngredientInput {
  id: IngredientId;
  name: string;
  categoryIds: IngredientCategoryId[];
  supplierId: SupplierId | null;
  packagePrice: NonNegativeNumber;
  packageAmount: PositiveNumber;
  stockCount: NonNegativeNumber;
  stockUnit: string;
  unitWeightGram: PositiveNumber;
}

export function createIngredient(
  input: CreateIngredientInput,
): Result<Ingredient, OutOfRangeError> {
  const pricePerGramResult = parseNonNegativeNumber(input.packagePrice / input.packageAmount);
  if (!pricePerGramResult.ok) return pricePerGramResult;
  return ok({ ...input, pricePerGram: pricePerGramResult.value });
}
