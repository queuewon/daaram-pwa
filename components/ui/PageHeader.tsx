"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  actions?: ReactNode;
}

export function PageHeader({ title, onBack, actions }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between gap-2">
      <button
        type="button"
        aria-label="뒤로가기"
        onClick={onBack ?? (() => router.back())}
        className="shrink-0 border-none px-1 py-1 text-sm text-gray-600 hover:bg-transparent hover:text-gray-900"
      >
        ← 뒤로가기
      </button>
      <h1 className="flex-1 truncate text-center">{title}</h1>
      <div className="flex shrink-0 justify-end">{actions}</div>
    </header>
  );
}
