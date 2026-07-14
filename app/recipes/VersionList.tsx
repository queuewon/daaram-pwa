"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/domain/date";
import { parseRecipeSnapshot } from "@/lib/domain/recipeSnapshot";
import { diffRecipeSnapshots, type LineChange } from "@/lib/domain/recipeVersionDiff";
import type { Ingredient, RecipeVersion } from "@/lib/domain/entities";

interface VersionListProps {
  versions: RecipeVersion[];
  ingredients: Ingredient[];
  /** 표시할 최대 개수. 지정해도 diff는 항상 바로 이전 버전과 비교한다. */
  limit?: number;
  onRestore?: (version: RecipeVersion) => void;
  restoreLabel?: string;
}

export default function VersionList({
  versions,
  ingredients,
  limit,
  onRestore,
  restoreLabel = "복원",
}: VersionListProps) {
  const ingredientNameOf = useMemo(() => {
    const map = new Map<string, string>(ingredients.map((i) => [i.id, i.name]));
    return (ingredientId: string) => map.get(ingredientId) ?? "알 수 없는 재료";
  }, [ingredients]);

  const parsed = useMemo(
    () =>
      versions.map((version) => {
        const result = parseRecipeSnapshot(version.snapshotJson);
        return { version, snapshot: result.ok ? result.value : null };
      }),
    [versions],
  );

  const [expanded, setExpanded] = useState(false);

  if (versions.length === 0) return null;

  const hasMore = limit !== undefined && parsed.length > limit;
  const visibleCount = limit === undefined || expanded ? parsed.length : limit;

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {parsed.slice(0, visibleCount).map(({ version, snapshot }, index) => {
          const isCurrent = index === 0;
          const previousSnapshot = parsed[index + 1]?.snapshot ?? null;
          const changes = snapshot ? diffRecipeSnapshots(previousSnapshot, snapshot) : [];
          return (
            <li key={version.id}>
              <Card accent="brand" className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">v{version.versionNo}</span>
                    {isCurrent && (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">
                        현재
                      </span>
                    )}
                  </div>
                  {onRestore && !isCurrent && (
                    <Button
                      type="button"
                      tone="brand"
                      variant="soft"
                      onClick={() => onRestore(version)}
                    >
                      {restoreLabel}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-400">{formatDateTime(version.createdAt)}</p>
                {changes.length > 0 ? (
                  <div className="space-y-1 border-t border-pink-100 pt-2 text-sm">
                    {changes.map((change) => (
                      <ChangeRow
                        key={change.ingredientId}
                        change={change}
                        name={ingredientNameOf(change.ingredientId)}
                      />
                    ))}
                  </div>
                ) : (
                  index === parsed.length - 1 && (
                    <p className="border-t border-pink-100 pt-2 text-sm text-gray-400">최초 등록</p>
                  )
                )}
              </Card>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full rounded-full border-transparent bg-brand-soft py-2 text-sm font-semibold text-brand hover:brightness-95"
        >
          {expanded ? "접기" : `더 보기 (${parsed.length - (limit ?? 0)}개)`}
        </button>
      )}
    </div>
  );
}

function ChangeRow({ change, name }: { change: LineChange; name: string }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-gray-600">
      <span className="font-medium text-gray-800">{name}</span>
      {change.kind === "added" ? (
        <span className="font-medium text-price-down">+ {change.toGram?.toLocaleString()}g</span>
      ) : change.kind === "removed" ? (
        <span className="font-medium text-danger line-through">
          {change.fromGram?.toLocaleString()}g
        </span>
      ) : (
        <>
          <span className="text-danger line-through">{change.fromGram?.toLocaleString()}g</span>
          <span className="text-gray-400">→</span>
          <span className="font-medium text-price-down">{change.toGram?.toLocaleString()}g</span>
        </>
      )}
    </p>
  );
}
