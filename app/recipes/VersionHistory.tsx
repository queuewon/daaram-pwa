"use client";

import type { RecipeVersion } from "@/lib/domain/entities";

interface VersionHistoryProps {
  versions: RecipeVersion[];
  onRestore: (version: RecipeVersion) => void;
}

export default function VersionHistory({ versions, onRestore }: VersionHistoryProps) {
  if (versions.length === 0) return null;

  return (
    <section>
      <h2>수정 이력</h2>
      <ul className="divide-y divide-gray-200 border border-gray-200 rounded">
        {versions.map((version) => (
          <li key={version.id} className="flex items-center justify-between gap-2 px-3 py-2">
            <span>
              v{version.versionNo} — {version.createdAt}
            </span>
            <button type="button" onClick={() => onRestore(version)}>
              이 버전으로 복원
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
