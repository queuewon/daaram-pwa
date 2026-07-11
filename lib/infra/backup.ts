import type { IndexableType, Table } from "dexie";
import { err, ok, type Result } from "../domain/result";
import { db } from "./db";
import {
  BACKUP_SCHEMA_VERSION,
  BACKUP_TABLE_NAMES,
  backupFileSchema,
  type BackupFile,
} from "./backup.schema";
import type { z } from "zod";

export interface ImportBackupOptions {
  forceEmpty?: boolean;
}

export type BackupImportError =
  | { type: "ValidationError"; issues: z.core.$ZodIssue[] }
  | { type: "UnsupportedVersion"; found: number }
  | { type: "RequiresConfirmation"; emptiedTables: string[] };

async function replaceAll<T, TKey extends IndexableType>(
  table: Table<T, TKey>,
  rows: readonly T[],
): Promise<void> {
  await table.clear();
  await table.bulkAdd(rows as T[]);
}

export function buildEmptyBackupFile(): BackupFile {
  const data = Object.fromEntries(BACKUP_TABLE_NAMES.map((name) => [name, []]));

  return backupFileSchema.parse({
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  });
}

// [F5] IndexedDB 전체 삭제. 새 삭제 로직을 작성하지 않고 이미 트랜잭션 원자성이
// 검증된 importBackup의 "빈 백업으로 덮어쓰기" 경로를 그대로 재사용한다.
export async function wipeAllData(): Promise<Result<void, BackupImportError>> {
  return importBackup(buildEmptyBackupFile(), { forceEmpty: true });
}

export async function exportBackup(): Promise<BackupFile> {
  const data = {
    recipes: await db.recipes.toArray(),
    recipe_versions: await db.recipe_versions.toArray(),
    ingredients: await db.ingredients.toArray(),
    ingredient_price_history: await db.ingredient_price_history.toArray(),
    suppliers: await db.suppliers.toArray(),
    daily_checklist: await db.daily_checklist.toArray(),
    recipe_categories: await db.recipe_categories.toArray(),
    ingredient_categories: await db.ingredient_categories.toArray(),
    package_units: await db.package_units.toArray(),
  };

  return backupFileSchema.parse({
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  });
}

export function triggerBackupDownload(backup: BackupFile, filename?: string): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? `daaram-backup-${backup.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
}

export interface ReadBackupFileError {
  type: "InvalidJson";
}

export async function readBackupFileAsJson(
  file: File,
): Promise<Result<unknown, ReadBackupFileError>> {
  const text = await file.text();

  try {
    return ok(JSON.parse(text));
  } catch {
    // JSON.parse는 문법 오류 시 SyntaxError를 던진다 — 경계 밖으로 예외를 내보내지 않고 Result로 흡수한다.
    return err({ type: "InvalidJson" });
  }
}

export async function importBackup(
  raw: unknown,
  options?: ImportBackupOptions,
): Promise<Result<void, BackupImportError>> {
  if (
    typeof raw === "object" &&
    raw !== null &&
    "schemaVersion" in raw &&
    (raw as { schemaVersion: unknown }).schemaVersion !== BACKUP_SCHEMA_VERSION
  ) {
    return err({
      type: "UnsupportedVersion",
      found: Number((raw as { schemaVersion: unknown }).schemaVersion),
    });
  }

  const parsed = backupFileSchema.safeParse(raw);
  if (!parsed.success) {
    return err({ type: "ValidationError", issues: parsed.error.issues });
  }
  const backup = parsed.data;

  const existingCounts = {
    recipes: await db.recipes.count(),
    recipe_versions: await db.recipe_versions.count(),
    ingredients: await db.ingredients.count(),
    ingredient_price_history: await db.ingredient_price_history.count(),
    suppliers: await db.suppliers.count(),
    daily_checklist: await db.daily_checklist.count(),
    recipe_categories: await db.recipe_categories.count(),
    ingredient_categories: await db.ingredient_categories.count(),
    package_units: await db.package_units.count(),
  };

  const emptiedTables = BACKUP_TABLE_NAMES.filter(
    (name) => existingCounts[name] > 0 && backup.data[name].length === 0,
  );

  if (emptiedTables.length > 0 && !options?.forceEmpty) {
    return err({ type: "RequiresConfirmation", emptiedTables });
  }

  await db.transaction("rw", db.tables, async () => {
    await replaceAll(db.recipes, backup.data.recipes);
    await replaceAll(db.recipe_versions, backup.data.recipe_versions);
    await replaceAll(db.ingredients, backup.data.ingredients);
    await replaceAll(db.ingredient_price_history, backup.data.ingredient_price_history);
    await replaceAll(db.suppliers, backup.data.suppliers);
    await replaceAll(db.daily_checklist, backup.data.daily_checklist);
    await replaceAll(db.recipe_categories, backup.data.recipe_categories);
    await replaceAll(db.ingredient_categories, backup.data.ingredient_categories);
    await replaceAll(db.package_units, backup.data.package_units);
  });

  return ok(undefined);
}
