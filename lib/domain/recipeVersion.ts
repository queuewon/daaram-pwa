import { serializeRecipeSnapshot, type RecipeSnapshot } from "./recipeSnapshot";
import type { RecipeId, RecipeVersionId } from "./ids";
import type { RecipeVersion } from "./entities";

export function nextVersionNo(existingVersionNos: readonly number[]): number {
  return existingVersionNos.length === 0 ? 1 : Math.max(...existingVersionNos) + 1;
}

export interface BuildRecipeVersionInput {
  id: RecipeVersionId;
  recipeId: RecipeId;
  versionNo: number;
  snapshot: RecipeSnapshot;
  createdAt: string;
}

export function buildRecipeVersion(input: BuildRecipeVersionInput): RecipeVersion {
  return {
    id: input.id,
    recipeId: input.recipeId,
    versionNo: input.versionNo,
    snapshotJson: serializeRecipeSnapshot(input.snapshot),
    createdAt: input.createdAt,
  };
}

export function latestVersionByRecipeId(
  versions: readonly RecipeVersion[],
): ReadonlyMap<RecipeId, RecipeVersion> {
  const result = new Map<RecipeId, RecipeVersion>();

  for (const version of versions) {
    const current = result.get(version.recipeId);
    if (!current || version.versionNo > current.versionNo) {
      result.set(version.recipeId, version);
    }
  }

  return result;
}
