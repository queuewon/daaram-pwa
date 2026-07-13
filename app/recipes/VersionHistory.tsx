"use client";

import { Button } from "@/components/ui/Button";
import type { RecipeVersion } from "@/lib/domain/entities";

interface VersionHistoryProps {
  versions: RecipeVersion[];
  onRestore?: (version: RecipeVersion) => void;
  limit?: number;
  /** Render only the list card, without the "수정 이력" heading/section wrapper. */
  bare?: boolean;
}

export default function VersionHistory({
  versions,
  onRestore,
  limit,
  bare = false,
}: VersionHistoryProps) {
  if (versions.length === 0) return null;

  const visibleVersions = limit === undefined ? versions : versions.slice(0, limit);

  const list = (
    <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {visibleVersions.map((version) => (
        <li key={version.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
          <span className="font-semibold text-gray-800">v{version.versionNo}</span>
          <span className="ml-auto text-gray-400">{version.createdAt}</span>
          {onRestore && (
            <Button type="button" tone="brand" variant="soft" onClick={() => onRestore(version)}>
              이 버전으로 복원
            </Button>
          )}
        </li>
      ))}
    </ul>
  );

  if (bare) return list;

  return (
    <section>
      <h2>수정 이력</h2>
      {list}
    </section>
  );
}
